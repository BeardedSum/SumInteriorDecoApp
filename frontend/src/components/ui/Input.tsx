import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-md text-gray-900 placeholder-gray-400',
            'focus:border-secondary-accent-blue focus:outline-none focus:ring-2 focus:ring-secondary-accent-blue/20',
            'transition-all duration-300',
            error && 'border-error focus:border-error focus:ring-error/20',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-md text-gray-900 placeholder-gray-400',
            'focus:border-secondary-accent-blue focus:outline-none focus:ring-2 focus:ring-secondary-accent-blue/20',
            'transition-all duration-300 min-h-[100px]',
            error && 'border-error focus:border-error focus:ring-error/20',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
