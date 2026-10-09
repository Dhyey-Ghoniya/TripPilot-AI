import React from 'react';
import { AlertOctagon } from 'lucide-react';
import Button from '../ui/Button';

const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="md">
          Retry Action
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
