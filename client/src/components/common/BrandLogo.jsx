import React from 'react';
import { Link } from 'react-router-dom';

export const BrandMark = ({ size = 38, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} aria-label="TripPilot route compass mark">
    <rect x="1" y="1" width="38" height="38" rx="12" fill="#fffaf1" stroke="#bca987" />
    <circle cx="20" cy="18" r="10.5" stroke="#3F3934" strokeWidth="2" />
    <path d="M20 8.5L23.5 18.5L20 27.5L16.5 18.5L20 8.5Z" fill="#f2a7a0" />
    <path d="M20 11.5L21.7 18.4L20 22L18.3 18.4L20 11.5Z" fill="#3F3934" />
    <path d="M8.5 30.5C12.1 27.4 15.7 27.1 19.2 29.3C22.5 31.4 25.5 31.5 28.3 29.4C29.6 28.4 30.9 27.9 32 27.8" stroke="#9CC9B5" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="8.5" cy="30.5" r="2.2" fill="#9CC9B5" />
    <circle cx="32" cy="27.8" r="2.2" fill="#3F3934" />
  </svg>
);

const BrandLogo = ({ size = 'md', showText = true, to = '/', className = '', textColor = 'auto' }) => {
  const pixelSizes = { sm: 30, md: 38, lg: 46 };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  const textClass = textColor === 'white' ? 'text-white' : textColor === 'dark' ? 'text-slate-950' : 'text-slate-950 dark:text-white';
  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="transition-transform duration-200 group-hover:rotate-[-4deg]"><BrandMark size={pixelSizes[size] || 38} /></div>
      {showText && <div className="leading-none"><span className={`${textSizes[size] || 'text-xl'} font-display tracking-[-0.04em] ${textClass}`}>TripPilot</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#954440] dark:text-secondary-300">Your travel copilot</span></div>}
    </div>
  );
  return to ? <Link to={to} className="group inline-flex items-center focus:outline-none">{content}</Link> : content;
};

export default BrandLogo;
