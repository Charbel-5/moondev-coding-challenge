'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FiUpload, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { submissionSchema } from '@/schemas/submissionSchema';
import { compressImage } from '@/utils/imageCompression';
import { SubmissionFormData, SubmissionResponse } from '@/types/submission';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface SubmitFormProps {
  existingSubmission?: SubmissionResponse;
  onSuccess?: (submission: SubmissionResponse) => void;
}

export default function SubmitForm({ existingSubmission, onSuccess }: SubmitFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingSubmission?.profile_picture || null
  );
  const [sourceFileName, setSourceFileName] = useState<string | null>(
    existingSubmission?.source_code 
      ? existingSubmission.source_code.split('/').pop() || null
      : null
  );
  const supabase = createClient();

  const initialValues: SubmissionFormData = {
    full_name: existingSubmission?.full_name || '',
    phone: existingSubmission?.phone || '',
    location: existingSubmission?.location || '',
    email: existingSubmission?.email || '',
    hobbies: existingSubmission?.hobbies || '',
    profile_picture: null,
    source_code: null,
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
      
      // Compress profile picture if provided
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

      // Upload source code if provided
      let sourceCodeUrl = existingSubmission?.source_code;
      if (values.source_code) {
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

      // Prepare submission data
      const submissionData = {
        full_name: values.full_name,
        phone: values.phone,
        location: values.location,
        email: values.email,
        hobbies: values.hobbies,
        profile_picture: profilePictureUrl,
        source_code: sourceCodeUrl,
        status: 'pending',
      };

      let response;
      
      // Update existing submission or create new one
      if (existingSubmission) {
        response = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id)
          .select('*')
          .single();
      } else {
        response = await supabase
          .from('submissions')
          .insert({
            ...submissionData,
            user_id: userId,
          })
          .select('*')
          .single();
      }

      if (response.error) {
        toast.error('Failed to save submission');
        console.error(response.error);
        return;
      }

      // Success!
      toast.success(existingSubmission 
        ? 'Your submission has been updated!' 
        : 'Your submission has been received!'
      );
      
      if (onSuccess && response.data) {
        onSuccess(response.data as SubmissionResponse);
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const ImageDropzone = ({ field, form }: any) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          form.setFieldValue(field.name, file);
          
          // Generate preview
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
        }
      },
    });

    return (
      <div className="mt-1">
        {previewUrl ? (
          <div className="relative mb-4">
            <div className="aspect-square w-40 h-40 rounded-lg overflow-hidden relative">
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
                setPreviewUrl(null);
                form.setFieldValue(field.name, null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              aria-label="Remove image"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <input {...getInputProps()} id={field.id} data-testid="profile-picture-input" />
            <div className="flex flex-col items-center">
              <FiUpload className="text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">
                Drag & drop your profile picture here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SourceCodeDropzone = ({ field, form }: any) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        'application/zip': ['.zip'],
        'application/x-zip-compressed': ['.zip'],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          form.setFieldValue(field.name, file);
          setSourceFileName(file.name);
        }
      },
    });

    return (
      <div className="mt-1">
        {sourceFileName ? (
          <div className="flex items-center p-3 bg-gray-50 rounded-md mb-4">
            <div className="flex-grow">
              <p className="text-sm font-medium">{sourceFileName}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSourceFileName(null);
                form.setFieldValue(field.name, null);
              }}
              className="ml-2 text-red-500 hover:text-red-700"
              aria-label="Remove file"
            >
              <FiX size={18} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
            </div>
          </div>
        )}
      </div>
    );
  };

  const buttonText = existingSubmission ? 'Update Submission' : 'Submit Application';

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={submissionSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className="space-y-6">
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

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}