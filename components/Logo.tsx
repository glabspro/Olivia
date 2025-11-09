import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 30C24.6274 30 30 24.6274 30 18C30 11.3726 24.6274 6 18 6C11.3726 6 6 11.3726 6 18" stroke="currentColor" strokeWidth="4" className="text-primary/50 dark:text-dark-primary/50"></path>
          <path d="M18 6C11.3726 6 6 11.3726 6 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-accent-teal"></path>
          <path d="M18 30C24.6274 30 30 24.6274 30 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary dark:text-dark-primary"></path>
        </svg>
      </div>
      <span className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary">Olivia</span>
    </div>
  );
};

export default Logo;
