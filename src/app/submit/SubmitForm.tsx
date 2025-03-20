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
      maxSize: 10 * 1024 * 1024, // 10MB
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
      <div className="mt-1">
        {previewUrl ? (
          <div className="relative">
            <div className="aspect-square w-40 h-40 rounded-lg overflow-hidden relative mb-2">
              <Image 
                src={previewUrl} 
                alt="Profile preview" 
                fill 
                className="object-cover" 
              />
            </div>
            <button
              type="button"
              onClick={() => {
                form.setFieldValue(field.name, null);
                setPreviewUrl(null);
                setHasExistingProfilePicture(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full absolute top-2 right-2"
              aria-label="Remove image"
            >
              <FiX size={18} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="dropzone flex flex-col items-center justify-center"
          >
            <input {...getInputProps()} id={field.id} data-testid="profile-picture-input" />
            <div className="flex flex-col items-center">
              <FiUpload className="text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">
                Drag & drop your profile picture here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG or GIF up to 10MB
              </p>
              {hasExistingProfilePicture && (
                <p className="text-blue-500 mt-2">
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
      <div className="mt-1">
        {sourceFileName ? (
          <div className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">{sourceFileName}</p>
              <p className="text-xs text-gray-500">Source code ZIP file</p>
            </div>
            <button
              type="button"
              onClick={() => {
                form.setFieldValue(field.name, null);
                setSourceFileName(null);
                setHasExistingSourceCode(false);
              }}
              className="text-red-500 hover:text-red-700"
              aria-label="Remove file"
            >
              <FiX size={18} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="dropzone flex flex-col items-center justify-center"
          >
            <input {...getInputProps()} id={field.id} data-testid="source-code-input" />
            <div className="flex flex-col items-center">
              <FiUpload className="text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">
                Drag & drop your source code ZIP file here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ZIP file up to 10MB
              </p>
              {hasExistingSourceCode && (
                <p className="text-blue-500 mt-2">
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
        <Form className="space-y-6 bg-white shadow-card rounded-lg p-6 animate-in">
          <div>
            <label htmlFor="full_name" className="form-label">
              Full Name
            </label>
            <Field
              id="full_name"
              name="full_name"
              type="text"
              className={`input-field ${
                errors.full_name && touched.full_name ? 'border-red-300' : ''
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
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <Field
              id="phone"
              name="phone"
              type="tel"
              className={`input-field ${
                errors.phone && touched.phone ? 'border-red-300' : ''
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
                errors.location && touched.location ? 'border-red-300' : ''
              }`}
              placeholder="City, Country"
            />
            <ErrorMessage
              name="location"
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
                errors.email && touched.email ? 'border-red-300' : ''
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
            <label htmlFor="hobbies" className="form-label">
              What do you like to do in life (other than coding)?
            </label>
            <Field
              as="textarea"
              id="hobbies"
              name="hobbies"
              rows={4}
              className={`input-field ${
                errors.hobbies && touched.hobbies ? 'border-red-300' : ''
              }`}
              placeholder="Tell us about your hobbies, interests, and passions outside of programming..."
            />
            <ErrorMessage
              name="hobbies"
              component="p"
              className="error-message"
            />
          </div>

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
            {hasExistingProfilePicture && (
              <p className="text-sm text-gray-500 mt-1">
                You can upload a new image or keep your existing one.
              </p>
            )}
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
            {hasExistingSourceCode && (
              <p className="text-sm text-gray-500 mt-1">
                You can upload a new ZIP file or keep your existing one.
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary w-full h-14 py-3 text-base"
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