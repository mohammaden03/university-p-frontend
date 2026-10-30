import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-teal-800 hover:bg-teal-900 text-amber-50 focus:ring-teal-700 shadow-sm border border-teal-950/20 active:bg-teal-950',
    secondary:
      'bg-stone-200 hover:bg-stone-300 text-stone-800 focus:ring-stone-400 border border-stone-300/80 active:bg-stone-300',
    outline:
      'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 focus:ring-teal-700 shadow-xs active:bg-stone-100',
    danger:
      'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-600 shadow-sm border border-rose-900/30 active:bg-rose-900',
    ghost:
      'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900 focus:ring-stone-400',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-1" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
