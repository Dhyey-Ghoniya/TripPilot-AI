import React from 'react';

const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-700/60';

  const variants = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
