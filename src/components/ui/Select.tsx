import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full text-right">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-600 mr-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          dir="rtl"
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 bg-white text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 ${
            error ? 'border-rose-400 bg-rose-50/30 text-rose-950' : 'border-stone-300'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
