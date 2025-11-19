import React, { useState } from 'react';

const Logo: React.FC = () => {
  const [clicks, setClicks] = useState(0);

  const handleSecretClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    
    setClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 4) {
        setTimeout(() => {
            const password = prompt("Credencial de Acceso:");
            if (password === "Luis2021.") {
                localStorage.setItem('olivia_god_mode', 'true');
                window.location.reload();
            } else {
                if (password !== null) alert("Acceso denegado");
            }
        }, 50);
        return 0;
      }
      return newCount;
    });

    // Reset counter if user stops clicking
    setTimeout(() => setClicks(0), 1000);
  };

  return (
    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleSecretClick}>
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-primary rounded-lg shadow-sm transition-transform active:scale-95 group-active:scale-95">
         <span className="text-white font-bold text-xl">O</span>
      </div>
      <span className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary tracking-tight">Olivia</span>
    </div>
  );
};

export default Logo;