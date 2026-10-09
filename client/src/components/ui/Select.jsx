import React from 'react';

const Select = ({
  label,
  options = [],
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 h-4" />
          </div>
        )}
        <select
          id={selectId}
          className={`w-full appearance-none rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 ${
            Icon ? 'pl-10' : 'px-4'
          } pr-10 py-2.5 ${
            error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
          } ${className}`}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
};

export default Select;
