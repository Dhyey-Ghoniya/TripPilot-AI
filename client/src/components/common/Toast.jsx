import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500',
    error: 'border-rose-500',
    warning: 'border-amber-500',
    info: 'border-sky-500',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-modal border-l-4 ${borderColors[type]} border-y border-r border-slate-100 dark:border-slate-700 animate-slideUp`}>
      {icons[type]}
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
