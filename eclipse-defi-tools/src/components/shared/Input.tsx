import React from 'react';
import { cn, buildInputStyles } from '../../theme/componentStyles';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  size = 'md',
  variant = 'default',
  error = false,
  errorMessage,
  label,
  helper,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputStyles = buildInputStyles({ size, variant });
  const errorStyles = error
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
    : '';
  const iconPaddingStyles = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(inputStyles, errorStyles, iconPaddingStyles, className)}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {(helper || errorMessage) && (
        <p
          className={cn(
            'mt-1 text-sm',
            error ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {errorMessage || helper}
        </p>
      )}
    </div>
  );
};

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helper?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  size = 'md',
  variant = 'default',
  error = false,
  errorMessage,
  label,
  helper,
  className,
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const inputStyles = buildInputStyles({ size, variant });
  const errorStyles = error
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
    : '';
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(inputStyles, errorStyles, 'min-h-[100px]', className)}
        {...props}
      />
      {(helper || errorMessage) && (
        <p
          className={cn(
            'mt-1 text-sm',
            error ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {errorMessage || helper}
        </p>
      )}
    </div>
  );
};