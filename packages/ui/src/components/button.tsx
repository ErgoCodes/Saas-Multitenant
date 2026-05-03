'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button as ShadcnButton, buttonVariants } from './ui/button';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantMap: Record<Variant, 'default' | 'outline' | 'ghost' | 'destructive'> = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
};

const sizeMap: Record<Size, 'sm' | 'default' | 'lg'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
