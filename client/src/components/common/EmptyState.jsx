import React from 'react';
import { Compass } from 'lucide-react';
import Button from '../ui/Button';

const EmptyState = ({
  icon: Icon = Compass,
  title = 'No items found',
  description = 'There are no items matching your request at this time.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-secondary-50 dark:bg-slate-700 text-secondary-600 dark:text-secondary-400 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
