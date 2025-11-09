import React, { useState } from 'react';
import { Building, Phone, User as UserIcon } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (companyName: string, phone: string) => void;
  onRegister: (fullName: string, companyName: string, phone: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [fullName, setFullName] = useState('');
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
    if (currentCode === '51' && currentPhone.length > 0 && currentPhone.length !== 9) {
      setPhoneError('El número de Perú debe tener 9 dígitos.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoneValid = validatePhone(phone, countryCode);
    if (!isPhoneValid || !phone) {
        if(!phone) setPhoneError('Este campo es obligatorio.');
        return;
    };

    const fullPhone = `${countryCode}${phone}`;
    
    if (isRegisterMode) {
      if (fullName && companyName && phone) {
        onRegister(fullName, companyName, fullPhone);
      } else {
        setPhoneError('Por favor, completa todos los campos.');
      }
    } else {
      if (companyName && phone) {
        onLogin(companyName, fullPhone);
      } else {
        setPhoneError('Por favor, completa ambos campos.');
      }
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value.replace(/\D/g, '');
    setPhone(newPhone);
    validatePhone(newPhone, countryCode);
  };

  const inputBaseClasses = "w-full py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-background dark:bg-dark-background">
      <div className="w-full max-w-sm">
          <div className="bg-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-border dark:border-dark-border">
            <div className="text-center mb-8">
                <div className="inline-block">
                    <Logo />
                </div>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                  {isRegisterMode ? "Crea tu cuenta para empezar." : "Ingresa para potenciar tus ventas."}
                </p>
            </div>
          
            <form className="space-y-6" onSubmit={handleSubmit}>
                {isRegisterMode && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Nombre completo</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                        id="fullName"
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`${inputBaseClasses} pl-11 pr-4`}
                        required
                        />
                    </div>
                  </div>
                )}
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
                        <div className="absolute inset-y-0 left-0 flex items-center">
                           <select 
                             value={countryCode} 
                             onChange={(e) => {
                               setCountryCode(e.target.value);
                               validatePhone(phone, e.target.value);
                             }}
                             className="bg-transparent h-full pl-3 pr-8 text-base focus:outline-none appearance-none cursor-pointer"
                           >
                              {southAmericanCountries.map(c => <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>)}
                           </select>
                        </div>
                        <input
                        id="phone"
                        type="tel"
                        placeholder={selectedCountry?.placeholder || "Tu número"}
                        value={phone}
                        onChange={handlePhoneChange}
                        className={`${inputBaseClasses} pl-24 ${phoneError ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                        required
                        />
                    </div>
                    {phoneError && <p className="mt-2 text-xs text-red-600">{phoneError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 font-bold text-white bg-gradient-to-r from-primary to-violet-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRegisterMode ? 'Registrarse' : 'Ingresar'}
                </button>
            </form>
            <div className="mt-6 text-center text-sm">
                <p className="text-textSecondary dark:text-dark-textSecondary">
                    {isRegisterMode ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}
                    <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="font-semibold text-primary hover:underline ml-1">
                        {isRegisterMode ? "Ingresa aquí" : "Regístrate"}
                    </button>
                </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Auth;