import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone-200/80 rounded-md ${className}`} />
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-200 rounded-xl bg-[#FAF9F6] ${className}`}>
    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
    {description && (
      <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export const Tabs: React.FC<{
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex border-b border-stone-200 gap-2 ${className}`}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors select-none ${
            isActive
              ? 'border-teal-700 text-teal-900 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-teal-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {tab.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
