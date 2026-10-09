import React from 'react';

const AttractionCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm animate-pulse flex flex-col h-full">
      {/* Image Skeleton */}
      <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700" />
      
      {/* Body Skeleton */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-full" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3" />
        </div>

        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-xl w-full" />

        <div className="flex gap-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

export default AttractionCardSkeleton;
