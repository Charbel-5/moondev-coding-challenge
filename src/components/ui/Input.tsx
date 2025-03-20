import { cn } from "@/utils/cn";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm",
              "text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2",
              "focus:ring-primary focus:ring-opacity-50 transition-colors",
              icon ? "pl-10" : "",
              error ? "border-error focus:ring-error" : "",
              "dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;