import React from 'react';

interface SpinnerProps {
    message: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary dark:border-dark-primary"></div>
      <p className="mt-4 text-white text-lg font-semibold">{message}</p>
    </div>
  );
};

export default Spinner;