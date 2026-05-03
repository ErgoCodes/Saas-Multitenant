'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-surface-900 placeholder-surface-400 shadow-sm transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-surface-100 disabled:opacity-60 ${
            error
              ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100'
              : 'border-surface-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
