import React, { useState } from 'react';
import { Building, Phone, Zap, FileText, Send } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (companyName: string, phone: string) => void;
}

const Feature = ({ icon, title, description, colorClasses }: { icon: React.ReactNode, title: string, description: string, colorClasses: string }) => (
    <li className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-textPrimary dark:text-dark-textPrimary">{title}</h3>
        <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">{description}</p>
      </div>
    </li>
);

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
    { code: '591', name: 'Bolivia', flag: '🇧🇴', placeholder: '71234567' },
    { code: '593', name: 'Ecuador', flag: '🇪🇨', placeholder: '099 123 4567' },
    { code: '595', name: 'Paraguay', flag: '🇵🇾', placeholder: '0981 123456' },
    { code: '598', name: 'Uruguay', flag: '🇺🇾', placeholder: '099 123 456' },
    { code: '58', name: 'Venezuela', flag: '🇻🇪', placeholder: '0414-1234567' },
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
        alert('Por favor, completa ambos campos para ingresar.');
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value.replace(/\D/g, ''); // Allow only digits
    setPhone(newPhone);
    validatePhone(newPhone, countryCode);
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    validatePhone(phone, newCode); // Re-validate with new country code
  };


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Form Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-background dark:bg-dark-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Logo />
          </div>
          <p className="text-textSecondary dark:text-dark-textSecondary mb-8 -mt-6">
            Ingresa para potenciar tus ventas.
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Nombre de tu empresa</label>
              <div className="relative">
                 <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input
                  id="companyName"
                  type="text"
                  placeholder="Ej: Soluciones Tech"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base"
                  required
                />
              </div>
            </div>
             <div>
                <label htmlFor="phone" className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Tu número de WhatsApp</label>
                <div className="relative flex">
                   <select 
                     value={countryCode} 
                     onChange={handleCountryChange}
                     className="absolute inset-y-0 left-0 pl-3 pr-8 h-full bg-transparent border-r border-gray-300 dark:border-gray-600 text-textPrimary dark:text-dark-textPrimary text-sm focus:ring-0 focus:outline-none"
                   >
                     {southAmericanCountries.map(country => (
                       <option key={country.code} value={country.code}>
                         {country.flag} +{country.code}
                       </option>
                     ))}
                   </select>
                   <input
                    id="phone"
                    type="tel"
                    placeholder={selectedCountry?.placeholder || "Tu número"}
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full py-3 bg-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-dark-primary'}`}
                    style={{paddingLeft: '6.5rem'}}
                    required
                  />
                </div>
                {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-4 font-bold text-white bg-primary rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!phoneError}
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
      
      {/* Marketing Section */}
      <div className="hidden md:flex w-1/2 bg-surface dark:bg-dark-surface flex-col justify-center p-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary leading-tight">
            Transforma cotizaciones en ventas, al instante.
          </h2>
          <p className="mt-4 text-textSecondary dark:text-dark-textSecondary">
            Olivia es tu asistente inteligente que automatiza el proceso de cotización para que te enfoques en lo que más importa: cerrar negocios.
          </p>
          <ul className="mt-8 space-y-6">
             <Feature 
                icon={<Zap size={18} />}
                title="Extracción Automática con IA"
                description="Sube la cotización de tu proveedor y deja que nuestra IA extraiga los productos por ti."
                colorClasses="bg-accent-teal/10 text-accent-teal"
            />
            <Feature 
                icon={<FileText size={18} />}
                title="PDFs Profesionales"
                description="Genera documentos limpios y profesionales con tu marca en segundos."
                colorClasses="bg-accent-coral/10 text-accent-coral"
            />
            <Feature 
                icon={<Send size={18} />}
                title="Envío Directo por WhatsApp"
                description="Envía la cotización final a tu cliente con un solo clic, directamente a su WhatsApp."
                colorClasses="bg-primary/10 dark:bg-dark-primary/20 text-primary dark:text-dark-primary"
            />
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Auth;