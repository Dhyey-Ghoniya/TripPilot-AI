import React from 'react';

const Card = ({ children, className = '', hover = false, padding = 'p-6', ...props }) => {
  return (
    <div
      className={`scrapbook-paper transition-shadow duration-200 ${
        hover ? 'scrapbook-wiggle hover:shadow-card' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
