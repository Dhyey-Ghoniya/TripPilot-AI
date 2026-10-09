import React from 'react';
import Spinner from '../ui/Spinner';

const LoadingState = ({ message = 'Loading contents...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Spinner size="lg" className="mb-4" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
};

export default LoadingState;
