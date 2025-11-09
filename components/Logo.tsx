import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
         <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 28C9.37258 28 4 22.6274 4 16C4 9.37258 9.37258 4 16 4" stroke="url(#paint0_linear_logo)" strokeWidth="4" strokeLinecap="round"/>
            <path d="M16 4C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28" stroke="url(#paint1_linear_logo)" strokeWidth="4" strokeLinecap="round"/>
            <defs>
            <linearGradient id="paint0_linear_logo" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA"/>
            <stop offset="1" stopColor="#E0F2FE"/>
            </linearGradient>
            <linearGradient id="paint1_linear_logo" x1="16" y1="28" x2="16" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA"/>
            <stop offset="1" stopColor="#8B5CF6"/>
            </linearGradient>
            </defs>
        </svg>
      </div>
      <span className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Olivia</span>
    </div>
  );
};

export default Logo;
