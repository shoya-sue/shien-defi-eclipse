import React from 'react';
import { cn, buildButtonStyles } from '../../theme/componentStyles';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}) => {
  const buttonStyles = buildButtonStyles({ size, variant });
  const widthStyles = fullWidth ? 'w-full' : '';
  const loadingStyles = loading ? 'relative' : '';
  
  return (
    <button
      className={cn(buttonStyles, widthStyles, loadingStyles, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={cn('flex items-center justify-center gap-2', loading && 'invisible')}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </span>
    </button>
  );
};

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  icon: React.ReactNode;
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  size = 'md',
  variant = 'secondary',
  icon,
  label,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };
  
  const buttonStyles = buildButtonStyles({ size, variant });
  
  return (
    <button
      className={cn(
        buttonStyles,
        sizeStyles[size],
        'aspect-square',
        className
      )}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
};