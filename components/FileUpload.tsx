import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-surface dark:bg-dark-surface rounded-lg p-6">
      <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4">1. Sube tu Cotización</h2>
      <label htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col justify-center items-center w-full p-8 md:p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-primary dark:border-dark-primary bg-pink-50 dark:bg-dark-surface' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
      >
        <UploadCloud className="w-12 h-12 text-textSecondary dark:text-dark-textSecondary mb-4" />
        <div className="text-center">
          <p className="text-base text-textSecondary dark:text-dark-textSecondary">
            <span className="font-semibold text-primary dark:text-dark-primary">Haz clic para subir</span> o arrastra y suelta
          </p>
          <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">PDF, JPG, PNG, o Excel</p>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={disabled} accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx"/>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;