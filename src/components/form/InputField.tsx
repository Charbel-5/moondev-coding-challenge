import { Field, ErrorMessage } from 'formik';
import { useState } from 'react';
import { IconType } from 'react-icons';

interface InputFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon?: IconType;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export const InputField = ({
  name,
  label,
  type = 'text',
  placeholder = '',
  icon: Icon,
  required = false,
  autoComplete,
  className = '',
}: InputFieldProps) => {
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
        <Field
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm
            ${Icon ? 'pl-10' : 'pl-3'} py-2 border focus:outline-none`}
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