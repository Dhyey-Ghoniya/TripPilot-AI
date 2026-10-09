import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, MapPinOff } from 'lucide-react';
import Button from '../../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 text-secondary-600 dark:text-secondary-400 flex items-center justify-center mx-auto shadow-inner">
          <MapPinOff className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-6xl font-black text-secondary-600 dark:text-secondary-400 tracking-wider">404</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Looks like you've taken a wrong turn.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            The destination you're looking for doesn't exist or may have moved to a new route.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/">
            <Button variant="primary" size="md" icon={Home}>
              Back Home
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="outline" size="md" icon={Compass}>
              Explore Destinations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
