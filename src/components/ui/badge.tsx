// src/components/ui/badge.tsx
import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantClasses = {
    default: 'border-transparent bg-blue-600 text-white hover:bg-blue-600/80',
    secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
    destructive: 'border-transparent bg-red-600 text-white hover:bg-red-600/80',
    outline: 'text-gray-900 border border-gray-300 hover:bg-gray-100',
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
