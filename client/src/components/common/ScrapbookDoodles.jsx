import React from 'react';

const ScrapbookDoodles = ({ className = '' }) => (
  <svg aria-hidden="true" viewBox="0 0 260 150" className={`pointer-events-none absolute ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 112c45-14 29-77 79-70 31 4 18 47 53 34 18-7 17-29 34-39" stroke="#554a3b" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" />
    <path d="m162 34 15 2-5 14" stroke="#554a3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M211 22h34v34h-34z" fill="#f2a7a0" stroke="#554a3b" strokeWidth="2" />
    <path d="M216 27h24v24h-24z" stroke="#fff8ee" strokeWidth="2" strokeDasharray="2 3" />
    <circle cx="228" cy="39" r="6" fill="#fff8ee" stroke="#554a3b" strokeWidth="1.5" />
    <path d="m81 107 3 8 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-8Z" fill="#f2a7a0" stroke="#554a3b" strokeWidth="1.5" />
  </svg>
);

export default ScrapbookDoodles;
