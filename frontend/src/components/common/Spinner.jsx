import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-block ${className}`}>
      <div className={`${sizeClass} border-4 border-t-primary border-r-primary border-b-primary/30 border-l-primary/30 rounded-full animate-spin`}></div>
    </div>
  );
};

export default Spinner;