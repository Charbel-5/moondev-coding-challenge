'use client';

import { useDropzone } from 'react-dropzone';
import { useState } from 'react';
import { FiUpload, FiCheck, FiX, FiFile } from 'react-icons/fi';

interface FileUploadProps {
  accept: Record<string, string[]>;
  onFileSelect: (file: File) => void;
  name: string;
  error?: string;
  touched?: boolean;
  label: string;
  description: string;
  maxSize?: number;
  currentFile: File | null;
}

export default function FileUpload({
  accept,
  onFileSelect,
  name,
  error,
  touched,
  label,
  description,
  maxSize = 10 * 1024 * 1024, // 10MB default
  currentFile,
}: FileUploadProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    onDropAccepted: (files) => {
      setFileError(null);
      onFileSelect(files[0]);
    },
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setFileError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setFileError('Invalid file type. Please check accepted formats.');
      } else {
        setFileError('Error uploading file. Please try again.');
      }
    },
  });
  
  const showError = (touched && error) || fileError;

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-primary bg-blue-50'
              : showError
              ? 'border-red-300 bg-red-50'
              : currentFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} name={name} id={name} />
        
        <div className="text-center">
          {currentFile ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(currentFile.size / 1024 / 1024).toFixed(2)}MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(null as unknown as File);
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-700 focus:outline-none"
              >
                Remove file
              </button>
            </div>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                {isDragActive ? (
                  <FiFile className="w-6 h-6 text-primary" />
                ) : (
                  <FiUpload className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
              <p className="text-xs text-gray-500">
                Maximum file size: {maxSize / 1024 / 1024}MB
              </p>
            </>
          )}
        </div>
      </div>
      
      {showError && (
        <p className="mt-1 text-sm text-red-600">{error || fileError}</p>
      )}
    </div>
  );
}