import React from 'react';

const Radio = ({ label, description, id, className = '', ...props }) => {
  const radioId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={radioId}
          type="radio"
          className={`h-4 w-4 border-slate-300 text-secondary-600 focus:ring-secondary-500 dark:border-slate-700 dark:bg-slate-800 transition cursor-pointer ${className}`}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label htmlFor={radioId} className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
    </div>
  );
};

export default Radio;
