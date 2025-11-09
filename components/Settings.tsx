import React, { useState, useRef } from 'react';
import { Settings, MarginType } from '../types';
import { Upload } from 'lucide-react';

interface SettingsProps {
  currentSettings: Settings;
  onSave: (newSettings: Settings) => void;
}

const AppSettings: React.FC<SettingsProps> = ({ currentSettings, onSave }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleMarginValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, defaultMarginValue: parseFloat(e.target.value) || 0 }));
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({ ...prev, companyLogo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  const inputClasses = "w-full px-4 py-3 bg-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary text-textPrimary dark:text-dark-textPrimary text-base";

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Nombre de la Empresa</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={settings.companyName}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Logo de la Empresa</label>
          <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
              {settings.companyLogo ? <img src={settings.companyLogo} alt="Company Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-center text-textSecondary dark:text-dark-textSecondary">Logo</span>}
            </div>
            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*"/>
            <button 
                type="button" 
                onClick={() => logoInputRef.current?.click()} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-teal border border-accent-teal rounded-lg hover:bg-accent-teal/10 transition-colors"
            >
              <Upload size={16} />
              Cambiar Logo
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="currencySymbol" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Símbolo de Moneda</label>
          <input
            type="text"
            id="currencySymbol"
            name="currencySymbol"
            value={settings.currencySymbol}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="S/, $, €..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Margen por Defecto</label>
          <div className="flex items-center">
            <select
              name="defaultMarginType"
              value={settings.defaultMarginType}
              onChange={handleInputChange}
              className="rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm h-12 bg-surface dark:bg-dark-surface text-textPrimary dark:text-dark-textPrimary focus:border-primary dark:focus:border-dark-primary focus:ring-primary dark:focus:ring-dark-primary text-base"
            >
              <option value={MarginType.PERCENTAGE}>%</option>
              <option value={MarginType.FIXED}>{settings.currencySymbol}</option>
            </select>
            <input
              type="number"
              name="defaultMarginValue"
              value={settings.defaultMarginValue}
              onChange={handleMarginValueChange}
              className="w-full h-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary bg-surface dark:bg-dark-surface text-textPrimary dark:text-dark-textPrimary text-base"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="px-8 py-3 bg-primary dark:bg-dark-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default AppSettings;