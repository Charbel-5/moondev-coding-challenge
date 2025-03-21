'use client';

import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FiUpload, FiX, FiCheck, FiLoader, FiDownload } from 'react-icons/fi';
import { submissionSchema } from '@/schemas/submissionSchema';
import { compressImage } from '@/utils/imageCompression';
import { SubmissionFormData, SubmissionResponse } from '@/types/submission';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { parseStorageUrl } from '@/utils/supabase';

interface SubmitFormProps {
  existingSubmission?: SubmissionResponse;
  onSuccess?: (submission: SubmissionResponse) => void;
}

export default function SubmitForm({ existingSubmission, onSuccess }: SubmitFormProps) {
  // Track the existing profile picture and source code urls
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(
    existingSubmission?.source_code 
      ? existingSubmission.source_code.split('/').pop() || null
      : null
  );
  const supabase = createClient();
  
  // Use state to track whether initial values are valid
  const [hasExistingProfilePicture, setHasExistingProfilePicture] = useState<boolean>(!!existingSubmission?.profile_picture);
  const [hasExistingSourceCode, setHasExistingSourceCode] = useState<boolean>(!!existingSubmission?.source_code);
  
  // When component mounts, fetch signed URLs if there are existing files
  useEffect(() => {
    async function fetchSignedUrls() {
      if (existingSubmission?.profile_picture) {
        try {
          const parsed = parseStorageUrl(existingSubmission.profile_picture);
          if (parsed) {
            const response = await fetch(
              `/api/storage?action=getSignedUrl&bucket=${parsed.bucket}&path=${encodeURIComponent(parsed.path)}`
            );
            
            if (response.ok) {
              const data = await response.json();
              setPreviewUrl(data.signedUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching profile picture URL:', error);
        }
      }
    }
    
    fetchSignedUrls();
  }, [existingSubmission?.profile_picture]);

  // Modified initial values to handle existing files
  const initialValues: SubmissionFormData = {
    full_name: existingSubmission?.full_name || '',
    phone: existingSubmission?.phone || '',
    location: existingSubmission?.location || '',
    email: existingSubmission?.email || '',
    hobbies: existingSubmission?.hobbies || '',
    profile_picture: null,  // Will be handled by the validation logic
    source_code: null,      // Will be handled by the validation logic
  };

  const handleSubmit = async (
    values: SubmissionFormData,
    { setSubmitting, resetForm }: FormikHelpers<SubmissionFormData>
  ) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }

      const userId = userData.user.id;
      
      // Prepare submission data
      const submissionData: Partial<SubmissionResponse> = {
        full_name: values.full_name,
        phone: values.phone,
        location: values.location,
        email: values.email,
        hobbies: values.hobbies,
        user_id: userId,
      };
      
      // Compress and upload profile picture if a new one is provided
      let profilePictureUrl = existingSubmission?.profile_picture;
      if (values.profile_picture) {
        const compressedImage = await compressImage(values.profile_picture);
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`${userId}/${Date.now()}-${values.profile_picture.name}`, compressedImage, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          toast.error('Failed to upload profile picture');
          console.error(uploadError);
          return;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(uploadData.path);
          
        profilePictureUrl = publicUrlData.publicUrl;
      }
      
      // Upload source code if a new one is provided
      let sourceCodeUrl = existingSubmission?.source_code;
      if (values.source_code) {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('source-code')
          .upload(`${userId}/${Date.now()}-${values.source_code.name}`, values.source_code, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          toast.error('Failed to upload source code');
          console.error(uploadError);
          return;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('source-code')
          .getPublicUrl(uploadData.path);
          
        sourceCodeUrl = publicUrlData.publicUrl;
      }
      
      // Add URLs to submission data if they exist
      if (profilePictureUrl) {
        submissionData.profile_picture = profilePictureUrl;
      }
      
      if (sourceCodeUrl) {
        submissionData.source_code = sourceCodeUrl;
      }

      // Update or create submission
      let result;
      if (existingSubmission) {
        result = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('user_id', userId);
      } else {
        result = await supabase
          .from('submissions')
          .insert([submissionData]);
      }

      if (result.error) {
        toast.error('Failed to submit application');
        console.error(result.error);
        return;
      }

      // Get the updated/created submission
      const { data: submissionResponse, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !submissionResponse) {
        toast.error('Failed to retrieve submission details');
        console.error(fetchError);
        return;
      }

      toast.success(existingSubmission ? 'Submission updated successfully' : 'Application submitted successfully');
      
      if (onSuccess) {
        onSuccess(submissionResponse as SubmissionResponse);
      }

      resetForm();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Custom component for image dropzone that shows preview
  const ImageDropzone = ({ field, form }: any) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        'image/*': ['.jpg', '.jpeg', '.png', '.gif']
      },
      maxSize: 5 * 1024 * 1024, // 5MB
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          form.setFieldValue(field.name, file);
          
          // Create a preview URL
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
          setHasExistingProfilePicture(false);
          
          return () => URL.revokeObjectURL(objectUrl);
        }
      },
      onDropRejected: (fileRejections) => {
        const error = fileRejections[0]?.errors[0]?.message || 'Invalid file';
        form.setFieldError(field.name, error);
        toast.error(`Image upload failed: ${error}`);
      },
    });

    return (
      <div className="mt-2">
        {previewUrl ? (
          <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center">
              <div className="aspect-square w-32 h-32 rounded-lg overflow-hidden relative flex-shrink-0">
                <Image 
                  src={previewUrl} 
                  alt="Profile preview" 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-medium text-gray-700">Preview Image</p>
                <p className="text-sm text-gray-500">Image ready to upload</p>
                <button
                  type="button"
                  onClick={() => {
                    form.setFieldValue(field.name, null);
                    setPreviewUrl(null);
                    setHasExistingProfilePicture(false);
                  }}
                  className="mt-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors flex items-center"
                >
                  <FiX size={16} className="mr-1" /> Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-200 hover:border-primary rounded-lg transition-colors bg-gray-50 p-6 cursor-pointer"
          >
            <input {...getInputProps()} id={field.id} data-testid="profile-picture-input" />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <FiUpload className="text-primary" size={24} />
              </div>
              <p className="text-gray-700 font-medium">
                Drag & drop your profile picture here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select a file
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG or GIF up to 5MB
              </p>
              {hasExistingProfilePicture && (
                <p className="text-primary text-sm mt-2 font-medium">
                  You already uploaded a profile picture
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom component for source code dropzone
  const SourceCodeDropzone = ({ field, form }: any) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        'application/zip': ['.zip'],
        'application/x-zip-compressed': ['.zip']
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          form.setFieldValue(field.name, file);
          setSourceFileName(file.name);
          setHasExistingSourceCode(false);
        }
      },
      onDropRejected: (fileRejections) => {
        const error = fileRejections[0]?.errors[0]?.message || 'Invalid file';
        form.setFieldError(field.name, error);
        toast.error(`File upload failed: ${error}`);
      },
    });

    return (
      <div className="mt-2">
        {sourceFileName ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <FiDownload className="text-primary" size={20} />
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-700">{sourceFileName}</p>
                <p className="text-xs text-gray-500">Source code ZIP file ready to upload</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  form.setFieldValue(field.name, null);
                  setSourceFileName(null);
                  setHasExistingSourceCode(false);
                }}
                className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                aria-label="Remove file"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-200 hover:border-primary rounded-lg transition-colors bg-gray-50 p-6 cursor-pointer"
          >
            <input {...getInputProps()} id={field.id} data-testid="source-code-input" />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <FiUpload className="text-primary" size={24} />
              </div>
              <p className="text-gray-700 font-medium">
                Drag & drop your source code ZIP file here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select a file
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ZIP file up to 10MB
              </p>
              {hasExistingSourceCode && (
                <p className="text-primary text-sm mt-2 font-medium">
                  You already uploaded your source code
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const buttonText = existingSubmission ? 'Update Submission' : 'Submit Application';

  // Create a custom validation schema that considers existing files
  const getValidationSchema = () => {
    // Create a validation schema based on whether files exist already
    if (hasExistingProfilePicture && hasExistingSourceCode) {
      // Both files exist, make both optional
      return submissionSchema.omit(['profile_picture', 'source_code']);
    } else if (hasExistingProfilePicture) {
      // Only profile picture exists
      return submissionSchema.omit(['profile_picture']);
    } else if (hasExistingSourceCode) {
      // Only source code exists
      return submissionSchema.omit(['source_code']);
    } else {
      // No existing files, use original schema
      return submissionSchema;
    }
  };

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={getValidationSchema()}
        onSubmit={handleSubmit}
      >
      {({ isSubmitting, errors, touched }) => (
        <Form className="bg-white shadow-card rounded-xl p-8 animate-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-center">
              {existingSubmission ? "Update Your Application" : "Developer Application"}
            </h2>
            {/* Add close button */}
            {existingSubmission && (
              <button 
                type="button"
                onClick={() => onSuccess && onSuccess(existingSubmission)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close form"
              >
                <FiX size={24} />
              </button>
            )}
          </div>
          
          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="form-label">
                  Full Name
                </label>
                <Field
                  id="full_name"
                  name="full_name"
                  type="text"
                  className={`input-field ${
                    errors.full_name && touched.full_name ? 'border-red-300 ring-red-100' : ''
                  }`}
                  placeholder="John Doe"
                />
                <ErrorMessage
                  name="full_name"
                  component="p"
                  className="error-message"
                />
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className={`input-field ${
                    errors.email && touched.email ? 'border-red-300 ring-red-100' : ''
                  }`}
                  placeholder="you@example.com"
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="error-message"
                />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <Field
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`input-field ${
                    errors.phone && touched.phone ? 'border-red-300 ring-red-100' : ''
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                <ErrorMessage
                  name="phone"
                  component="p"
                  className="error-message"
                />
              </div>

              <div>
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <Field
                  id="location"
                  name="location"
                  type="text"
                  className={`input-field ${
                    errors.location && touched.location ? 'border-red-300 ring-red-100' : ''
                  }`}
                  placeholder="City, Country"
                />
                <ErrorMessage
                  name="location"
                  component="p"
                  className="error-message"
                />
              </div>
            </div>
          </div>
          
          {/* Hobbies Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">About You</h3>
            <div>
              <label htmlFor="hobbies" className="form-label">
                What do you like to do in life (other than coding)?
              </label>
              <Field
                as="textarea"
                id="hobbies"
                name="hobbies"
                rows={4}
                className={`input-field ${
                  errors.hobbies && touched.hobbies ? 'border-red-300 ring-red-100' : ''
                }`}
                placeholder="Tell us about your hobbies, interests, and passions outside of programming..."
              />
              <ErrorMessage
                name="hobbies"
                component="p"
                className="error-message"
              />
            </div>
          </div>
          
          {/* Files Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Upload Files</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="profile_picture" className="form-label">
                  Profile Picture
                </label>
                <Field name="profile_picture" component={ImageDropzone} />
                <ErrorMessage
                  name="profile_picture"
                  component="p"
                  className="error-message"
                />
              </div>

              <div>
                <label htmlFor="source_code" className="form-label">
                  Source Code (ZIP file)
                </label>
                <Field name="source_code" component={SourceCodeDropzone} />
                <ErrorMessage
                  name="source_code"
                  component="p"
                  className="error-message"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="btn btn-primary h-14 py-3 text-base px-8 min-w-[200px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : existingSubmission ? "Update Submission" : "Submit Application"}
            </button>
          </div>
        </Form>
        )}
      </Formik>
    );
}