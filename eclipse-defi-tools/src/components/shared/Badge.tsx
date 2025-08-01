import React from 'react';
import { cn, componentStyles } from '../../theme/componentStyles';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  size = 'md',
  variant = 'info',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        componentStyles.badge.base,
        componentStyles.badge.size[size],
        componentStyles.status[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};