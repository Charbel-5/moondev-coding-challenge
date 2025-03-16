import * as yup from 'yup';

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export const submissionSchema = yup.object().shape({
  full_name: yup.string()
    .required('Full name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format'),
  
  location: yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  
  email: yup.string()
    .required('Email is required')
    .email('Invalid email format'),
  
  hobbies: yup.string()
    .required('Hobbies are required')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Response too long (maximum 1000 characters)'),
  
  profile_picture: yup.mixed()
    .required('Profile picture is required')
    .test(
      'fileSize',
      'File is too large (max 10MB)',
      value => !value || (value as File).size <= FILE_SIZE_LIMIT
    )
    .test(
      'fileType',
      'Unsupported file type',
      value => !value || ['image/jpeg', 'image/png', 'image/gif'].includes((value as File).type)
    ),
  
  source_code: yup.mixed()
    .required('Source code is required')
    .test(
      'fileSize',
      'File is too large (max 10MB)',
      value => !value || (value as File).size <= FILE_SIZE_LIMIT
    )
    .test(
      'fileType',
      'Only ZIP files are allowed',
      value => !value || ['application/zip', 'application/x-zip-compressed'].includes((value as File).type)
    )
});

// Schema for updating a submission - allows null values for files when they already exist
export const updateSubmissionSchema = yup.object().shape({
  full_name: yup.string()
    .required('Full name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format'),
  
  location: yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  
  email: yup.string()
    .required('Email is required')
    .email('Invalid email format'),
  
  hobbies: yup.string()
    .required('Hobbies are required')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Response too long (maximum 1000 characters)'),
  
  profile_picture: yup.mixed()
    .test(
      'fileSize',
      'File is too large (max 10MB)',
      value => !value || value === null || (value as File).size <= FILE_SIZE_LIMIT
    )
    .test(
      'fileType',
      'Unsupported file type',
      value => !value || value === null || !(value as File).type || ['image/jpeg', 'image/png', 'image/gif'].includes((value as File).type)
    ),
  
  source_code: yup.mixed()
    .test(
      'fileSize',
      'File is too large (max 10MB)',
      value => !value || value === null || (value as File).size <= FILE_SIZE_LIMIT
    )
    .test(
      'fileType',
      'Only ZIP files are allowed',
      value => !value || value === null || !(value as File).type || ['application/zip', 'application/x-zip-compressed'].includes((value as File).type)
    )
});