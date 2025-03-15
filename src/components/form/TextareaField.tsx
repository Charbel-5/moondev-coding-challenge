import { Field, ErrorMessage } from 'formik';
import { useState } from 'react';
import { IconType } from 'react-icons';

interface TextareaFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  icon?: IconType;
  required?: boolean;
  rows?: number;
  className?: string;
}

export const TextareaField = ({
  name,
  label,
  placeholder = '',
  icon: Icon,
  required = false,
  rows = 4,
  className = '',
}: TextareaFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className={`relative rounded-md shadow-sm ${
          isFocused ? 'ring-2 ring-primary ring-opacity-50' : ''
        }`}
      >
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
        <Field
          as="textarea"
          id={name}
          name={name}
          placeholder={placeholder}
          rows={rows}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm
            ${Icon ? 'pl-10' : 'pl-3'} py-2 border focus:outline-none resize-none`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      <ErrorMessage
        name={name}
        component="div"
        className="mt-1 text-sm text-red-600"
      />
    </div>
  );
};