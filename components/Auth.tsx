import React, { useState } from 'react';
import { Sparkles, FileText, Send } from 'lucide-react';
import Logo from './Logo';

const AppVisual = () => (
    <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-border flex items-center justify-center p-8 relative overflow-hidden">
        {/* Main Workspace Mockup */}
        <div className="relative w-full h-auto bg-white rounded-xl shadow-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-1.5 p-1">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            </div>
            <div className="p-2 space-y-3">
                <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                <div className="h-20 bg-gray-50 rounded-lg mt-4"></div>
                <div className="h-3 bg-gray-100 rounded-full w-full"></div>
                <div className="h-3 bg-gray-100 rounded-full w-5/6"></div>
            </div>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-10 -left-5 w-16 h-16 bg-accent-teal rounded-2xl shadow-lg flex items-center justify-center transform -rotate-12">
            <Sparkles className="w-8 h-8 text-white"/>
        </div>
        <div className="absolute top-1/2 -right-6 w-16 h-16 bg-accent-coral rounded-2xl shadow-lg flex items-center justify-center transform rotate-12">
            <Send className="w-8 h-8 text-white"/>
        </div>
        <div className="absolute bottom-12 -left-4 w-16 h-16 bg-accent-yellow rounded-2xl shadow-lg flex items-center justify-center transform rotate-6">
            <FileText className="w-8 h-8 text-white"/>
        </div>
    </div>
);


interface AuthProps {
  onLogin: (companyName: string, phone: string) => void;
  onRegister: (fullName: string, companyName: string, phone: string) => void;
}

const FeatureList = () => (
  <ul className="space-y-4">
    <li className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-accent-teal mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary">
        <span className="font-semibold text-textPrimary dark:text-dark-textPrimary">Extracción con IA.</span> Sube un PDF o imagen y deja que Olivia extraiga los productos por ti.
      </p>
    </li>
    <li className="flex items-start gap-3">
      <FileText className="w-5 h-5 text-accent-yellow mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary">
        <span className="font-semibold text-textPrimary dark:text-dark-textPrimary">PDFs Profesionales.</span> Genera cotizaciones con tu marca y diseños elegantes en segundos.
      </p>
    </li>
    <li className="flex items-start gap-3">
      <Send className="w-5 h-5 text-accent-coral mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary">
        <span className="font-semibold text-textPrimary dark:text-dark-textPrimary">Envío por WhatsApp.</span> Cierra tratos más rápido enviando tus cotizaciones directamente a tus clientes.
      </p>
    </li>
  </ul>
);


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

  const inputBaseClasses = "w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";
  const labelClasses = "block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary">
      {/* Column 1: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-2">
            {isRegisterMode ? 'Crea tu cuenta gratis' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-textSecondary dark:text-dark-textSecondary mb-8">
            {isRegisterMode ? 'Únete a miles de emprendedores.' : 'Ingresa a tu cuenta para continuar.'}
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
              {isRegisterMode && (
                <div>
                  <label htmlFor="fullName" className={labelClasses}>Nombre completo</label>
                  <input
                  id="fullName"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputBaseClasses}
                  required
                  />
                </div>
              )}
              <div>
                <label htmlFor="companyName" className={labelClasses}>Nombre de tu empresa</label>
                <input
                id="companyName"
                type="text"
                placeholder="Ej: Soluciones Tech"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputBaseClasses}
                required
                />
              </div>
              <div>
                  <label htmlFor="phone" className={labelClasses}>Tu número de WhatsApp</label>
                  <div className="relative flex items-center">
                       <div className="absolute inset-y-0 left-0 flex items-center">
                          <select 
                            value={countryCode} 
                            onChange={(e) => {
                              setCountryCode(e.target.value);
                              validatePhone(phone, e.target.value);
                            }}
                            className="bg-transparent h-full pl-3 pr-8 text-base focus:outline-none appearance-none cursor-pointer text-textSecondary dark:text-dark-textSecondary"
                          >
                            {southAmericanCountries.map(c => <option key={c.code} value={c.code} className="bg-surface dark:bg-dark-surface">{c.flag} +{c.code}</option>)}
                          </select>
                      </div>
                      <input
                      id="phone"
                      type="tel"
                      placeholder={selectedCountry?.placeholder || "Tu número"}
                      value={phone}
                      onChange={handlePhoneChange}
                      className={`${inputBaseClasses} pl-28 ${phoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      required
                      />
                  </div>
                  {phoneError && <p className="mt-2 text-xs text-red-600">{phoneError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3 font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRegisterMode ? 'Crear cuenta' : 'Ingresar'}
              </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)} 
              className="w-full py-3 font-semibold text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10 rounded-lg hover:bg-primary/20 dark:hover:bg-dark-primary/20 transition-colors"
            >
              {isRegisterMode ? "¿Ya tienes una cuenta? Ingresa aquí" : "¿No tienes una cuenta? Regístrate"}
            </button>
          </div>
          <div className="lg:hidden mt-12">
            <FeatureList />
          </div>
        </div>
      </div>

      {/* Column 2: Marketing */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-dark-surface p-8 sm:p-12 flex-col justify-center relative overflow-hidden order-1 lg:order-2 hidden lg:flex">
        <div className="w-full max-w-md mx-auto z-10">
          <div className="mb-8">
            <Logo />
          </div>
          <h2 className="text-4xl font-bold text-textPrimary dark:text-dark-textPrimary leading-tight mb-6">
            Potencia tus ventas con una gestión de cotizaciones todo-en-uno.
          </h2>
          <div className="w-full h-80 rounded-lg mb-8">
            <AppVisual />
          </div>
          <FeatureList />
        </div>
      </div>
    </div>
  );
};

export default Auth;