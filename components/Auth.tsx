import React, { useState } from 'react';
import { Building, Phone, Zap, FileText, Send } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (companyName: string, phone: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('51');
  const [phoneError, setPhoneError] = useState('');

  const southAmericanCountries = [
    { code: '51', name: 'Peru', flag: '🇵🇪', placeholder: '999 888 777' },
    { code: '54', name: 'Argentina', flag: '🇦🇷', placeholder: '9 11 2345-6789' },
    { code: '55', name: 'Brazil', flag: '🇧🇷', placeholder: '(21) 99999-9999' },
    { code: '56', name: 'Chile', flag: '🇨🇱', placeholder: '9 8765 4321' },
    { code: '57', name: 'Colombia', flag: '🇨🇴', placeholder: '300 1234567' },
  ];
  
  const selectedCountry = southAmericanCountries.find(c => c.code === countryCode);

  const validatePhone = (currentPhone: string, currentCode: string) => {
    if (currentCode === '51' && currentPhone.length !== 9) {
      setPhoneError('El número de Perú debe tener 9 dígitos.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePhone(phone, countryCode) && companyName && phone) {
      const fullPhone = `${countryCode}${phone}`;
      onLogin(companyName, fullPhone);
    } else if (!companyName || !phone) {
        setPhoneError('Por favor, completa ambos campos.');
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value.replace(/\D/g, '');
    setPhone(newPhone);
    validatePhone(newPhone, countryCode);
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    validatePhone(phone, newCode);
  };

  const inputBaseClasses = "w-full py-3 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-background dark:bg-dark-background">
      <div className="w-full max-w-sm">
          <div className="bg-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-border dark:border-dark-border">
            <div className="text-center mb-8">
                <div className="inline-block">
                    <Logo />
                </div>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                Ingresa para potenciar tus ventas.
                </p>
            </div>
          
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Nombre de tu empresa</label>
                <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                    id="companyName"
                    type="text"
                    placeholder="Ej: Soluciones Tech"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`${inputBaseClasses} pl-11 pr-4`}
                    required
                    />
                </div>
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Tu número de WhatsApp</label>
                    <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 border-r border-border dark:border-dark-border pr-3">
                            <span className="text-lg">{selectedCountry?.flag}</span>
                            <span className="ml-2 text-sm text-textSecondary dark:text-dark-textSecondary">+{countryCode}</span>
                        </div>
                        <input
                        id="phone"
                        type="tel"
                        placeholder={selectedCountry?.placeholder || "Tu número"}
                        value={phone}
                        onChange={handlePhoneChange}
                        className={`${inputBaseClasses} ${phoneError ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                        style={{paddingLeft: '6.5rem'}}
                        required
                        />
                    </div>
                    {phoneError && <p className="mt-2 text-xs text-red-600">{phoneError}</p>}
                </div>

                <button
                type="submit"
                className="w-full py-3 font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!!phoneError}
                >
                Ingresar
                </button>
            </form>
          </div>
      </div>
    </div>
  );
};

export default Auth;
