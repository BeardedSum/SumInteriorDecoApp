import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'premium' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-navy text-white hover:bg-primary-navy-dark shadow-md',
      secondary: 'bg-transparent text-primary-navy border-2 border-primary-navy hover:bg-secondary-off-white',
      accent: 'bg-secondary-accent-blue text-white hover:bg-blue-500 shadow-md',
      premium: 'bg-gradient-to-r from-secondary-luxury-purple to-purple-700 text-white shadow-lg hover:shadow-xl',
      ghost: 'bg-transparent text-primary-navy hover:bg-gray-100',
      danger: 'bg-error text-white hover:bg-red-600 shadow-md',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
