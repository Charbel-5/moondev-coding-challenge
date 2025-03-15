import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ErrorMessage } from 'formik';
import imageCompression from 'browser-image-compression';
import { FiUploadCloud, FiX } from 'react-icons/fi';

interface ImageUploadProps {
  name: string;
  label: string;
  setFieldValue: (field: string, value: any) => void;
  required?: boolean;
  maxSize?: number; // in MB
}

export const ImageUpload = ({
  name,
  label,
  setFieldValue,
  required = false,
  maxSize = 1, // Default 1MB max
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<string | null>(null);

  const compressImage = async (file: File) => {
    setIsCompressing(true);
    setOriginalSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    try {
      const options = {
        maxSizeMB: maxSize,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setCompressedSize((compressedFile.size / (1024 * 1024)).toFixed(2) + ' MB');
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreview(objectUrl);
      
      // Convert to blob for upload
      setFieldValue(name, compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        await compressImage(file);
      }
    },
    [setFieldValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
  });

  const removeImage = () => {
    setPreview(null);
    setFieldValue(name, null);
    setOriginalSize(null);
    setCompressedSize(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            transition-all duration-200 ease-in-out`}
        >
          <input {...getInputProps()} />
          <FiUploadCloud className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the image here"
              : "Drag & drop an image, or click to select"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Max size: {maxSize}MB, will be resized to max 1080px)
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto max-h-64 object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <FiX className="h-5 w-5" />
          </button>
          {originalSize && compressedSize && (
            <div className="text-xs text-gray-500 p-2 bg-gray-100">
              Original: {originalSize} → Compressed: {compressedSize}
            </div>
          )}
        </div>
      )}
      
      {isCompressing && (
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 mr-2 text-primary" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Compressing image...
        </div>
      )}
      
      <ErrorMessage
        name={name}
        component="div"
        className="mt-1 text-sm text-red-600"
      />
    </div>
  );
};