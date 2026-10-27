import React from 'react';

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const baseStyles = 'inline-flex items-center border border-[#bca987] font-bold rounded-sm tracking-wide';

  const variants = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-slate-800 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950/80 dark:text-secondary-300',
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-950/80 dark:text-accent-300',
    success: 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-100',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
