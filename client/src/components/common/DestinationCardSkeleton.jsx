import React from 'react';
import Card from './Card';
import Skeleton from '../ui/Skeleton';

const DestinationCardSkeleton = () => {
  return (
    <Card className="p-0 overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
      <Skeleton height="14rem" className="w-full" variant="rectangular" />
      <div className="p-6 space-y-4">
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="2.5rem" width="100%" />
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
          <Skeleton height="1rem" width="30%" />
          <Skeleton height="2rem" width="40%" />
        </div>
      </div>
    </Card>
  );
};

export default DestinationCardSkeleton;
