import React from 'react';

const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-700 ${className}`}>
      <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`py-3 px-1 inline-flex items-center gap-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-secondary-600 text-secondary-600 dark:text-secondary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 py-0.5 px-2 text-xs rounded-full ${
                  isActive ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
