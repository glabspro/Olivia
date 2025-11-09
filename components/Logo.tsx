import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-primary rounded-lg">
         <span className="text-white font-bold text-xl">O</span>
      </div>
      <span className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary tracking-tight">Olivia</span>
    </div>
  );
};

export default Logo;