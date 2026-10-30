import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'train'
  | 'val'
  | 'test'
  | 'unassigned';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-stone-100 text-stone-800 border-stone-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
    info: 'bg-teal-50 text-teal-800 border-teal-300',
    outline: 'bg-transparent text-stone-700 border-stone-300',
    train: 'bg-blue-50 text-blue-800 border-blue-300',
    val: 'bg-purple-50 text-purple-800 border-purple-300',
    test: 'bg-amber-50 text-amber-900 border-amber-300',
    unassigned: 'bg-stone-100 text-stone-600 border-stone-300 border-dashed',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs select-none ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
