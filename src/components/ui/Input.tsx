import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isLtr?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isLtr = false, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full text-right">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-600 mr-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          dir={isLtr ? 'ltr' : 'rtl'}
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 disabled:bg-stone-100 disabled:text-stone-400 ${
            isLtr ? 'text-left font-mono' : 'text-right'
          } ${
            error
              ? 'border-rose-400 bg-rose-50/30 text-rose-950 focus:ring-rose-500'
              : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full text-right">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-600 mr-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          dir="rtl"
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 disabled:bg-stone-100 disabled:text-stone-400 text-right ${
            error
              ? 'border-rose-400 bg-rose-50/30 text-rose-950 focus:ring-rose-500'
              : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
