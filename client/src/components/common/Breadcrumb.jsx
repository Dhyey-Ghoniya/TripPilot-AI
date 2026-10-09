import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center hover:text-secondary-600 dark:hover:text-secondary-400 transition"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Home
          </Link>
        </li>
        {items.map((item, idx) => (
          <li key={idx}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-secondary-600 dark:hover:text-secondary-400 transition"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
