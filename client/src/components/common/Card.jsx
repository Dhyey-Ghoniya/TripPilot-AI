import React from 'react';

const Card = ({ children, className = '', hover = false, padding = 'p-6', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-soft transition-all duration-300 ${
        hover ? 'hover:shadow-card hover:-translate-y-1' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
