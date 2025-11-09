import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" stroke="url(#paint0_linear_1_2)" strokeWidth="4"/>
            <defs>
            <linearGradient id="paint0_linear_1_2" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
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
