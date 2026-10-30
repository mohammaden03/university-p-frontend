import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'parchment' | 'interactive';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border-stone-200 shadow-xs',
    parchment: 'bg-[#FAF7EE] border-[#E8DFC8] shadow-xs',
    interactive:
      'bg-white border-stone-200 shadow-xs hover:border-teal-700/60 hover:shadow-md transition-all cursor-pointer',
  }[variant];

  return (
    <div
      className={`rounded-xl border p-5 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 mb-4 pb-3 border-b border-stone-100 ${className}`}>
    <div>
      <h3 className="font-semibold text-stone-900 text-base leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
