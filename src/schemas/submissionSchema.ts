import * as Yup from 'yup';

// Define maximum file sizes
const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024; // 5MB initially, we'll compress to 1MB
const MAX_SOURCE_CODE_SIZE = 50 * 1024 * 1024; // 50MB for source code zip

export const submissionSchema = Yup.object().shape({
  full_name: Yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  
  phone: Yup.string()
    .required('Phone number is required')
    .matches(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      'Please enter a valid phone number'
    ),
  
  location: Yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  
  hobbies: Yup.string()
    .required('Please tell us about your interests')
    .min(20, 'Please provide at least 20 characters about your interests')
    .max(1000, 'Please keep your interests under 1000 characters'),
  
  profile_picture: Yup.mixed()
    .test('fileSize', 'The file is too large (max 5MB)', function (value) {
      if (!value) return true; // Allow empty files
      return (value as File).size <= MAX_PROFILE_PICTURE_SIZE;
    })
    .test('fileType', 'Only image files are allowed', function (value) {
      if (!value) return true; // Allow empty files
      return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes((value as File).type);
    }),
  
  source_code: Yup.mixed()
    .test('fileSize', 'The file is too large (max 50MB)', function (value) {
      if (!value) return true; // Allow empty files
      return (value as File).size <= MAX_SOURCE_CODE_SIZE;
    })
    .test('fileType', 'Only ZIP files are allowed', function (value) {
      if (!value) return true; // Allow empty files
      return ['application/zip', 'application/x-zip-compressed'].includes((value as File).type);
    })
});