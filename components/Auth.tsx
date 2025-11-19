
import React, { useState } from 'react';
import { Sparkles, FileText, Send, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import Spinner from './Spinner';

// This is a minimal, non-functional component for visual mockups.
const AppVisual = () => (
    <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-border flex items-center justify-center p-8 relative overflow-hidden">
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
        <div className="absolute top-10 -left-5 w-16 h-16 bg-accent-teal rounded-2xl shadow-lg flex items-center justify-center transform -rotate-12"><Sparkles className="w-8 h-8 text-white"/></div>
        <div className="absolute top-1/2 -right-6 w-16 h-16 bg-accent-coral rounded-2xl shadow-lg flex items-center justify-center transform rotate-12"><Send className="w-8 h-8 text-white"/></div>
        <div className="absolute bottom-12 -left-4 w-16 h-16 bg-accent-yellow rounded-2xl shadow-lg flex items-center justify-center transform rotate-6"><FileText className="w-8 h-8 text-white"/></div>
    </div>
);

const FeatureList = () => (
  <ul className="space-y-4">
    <li className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-accent-teal mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary"><span className="font-semibold text-textPrimary dark:text-dark-textPrimary">Extracción con IA.</span> Sube un PDF y deja que Olivia extraiga los productos.</p>
    </li>
    <li className="flex items-start gap-3">
      <FileText className="w-5 h-5 text-accent-yellow mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary"><span className="font-semibold text-textPrimary dark:text-dark-textPrimary">PDFs Profesionales.</span> Genera cotizaciones con tu marca en segundos.</p>
    </li>
    <li className="flex items-start gap-3">
      <Send className="w-5 h-5 text-accent-coral mt-1 flex-shrink-0" />
      <p className="text-textSecondary dark:text-dark-textSecondary"><span className="font-semibold text-textPrimary dark:text-dark-textPrimary">Envío por WhatsApp.</span> Cierra tratos más rápido enviando tus cotizaciones.</p>
    </li>
  </ul>
);

const countries = [
  { code: 'PE', name: 'Perú', dial_code: '+51', flag: '🇵🇪' },
  { code: 'AR', name: 'Argentina', dial_code: '+54', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', dial_code: '+591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', dial_code: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial_code: '+57', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', dial_code: '+506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', dial_code: '+53', flag: '🇨🇺' },
  { code: 'EC', name: 'Ecuador', dial_code: '+593', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', dial_code: '+503', flag: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', dial_code: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dial_code: '+504', flag: '🇭🇳' },
  { code: 'MX', name: 'México', dial_code: '+52', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', dial_code: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', dial_code: '+507', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', dial_code: '+595', flag: '🇵🇾' },
  { code: 'PR', name: 'Puerto Rico', dial_code: '+1', flag: '🇵🇷' },
  { code: 'DO', name: 'Rep. Dominicana', dial_code: '+1', flag: '🇩🇴' },
  { code: 'UY', name: 'Uruguay', dial_code: '+598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', dial_code: '+58', flag: '🇻🇪' },
];

interface AuthProps {
  onLogin: (phone: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+51');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación simple: 9 dígitos
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 9) {
        setError('Por favor ingresa un número válido de 9 dígitos para continuar.');
        setLoading(false);
        return;
    }

    // Simular retraso de red para mejor UX
    setTimeout(() => {
        setLoading(false);
        onLogin(phone);
    }, 1000);
  };

  const inputBaseClasses = "w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";
  const labelClasses = "block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary">
      {loading && <Spinner message="Ingresando..." />}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          
          <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-2">
            Bienvenido a Olivia
          </h1>
          <p className="text-textSecondary dark:text-dark-textSecondary mb-8">
            Ingresa tu número de celular para acceder a tu cuenta (Demo).
          </p>
          
            <form className="space-y-6" onSubmit={handlePhoneSubmit}>
              <div>
                <label htmlFor="phone" className={labelClasses}>Tu número de celular</label>
                <div className="flex">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className={`${inputBaseClasses} w-auto rounded-r-none pr-8 appearance-none`}
                    aria-label="Código de país"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.dial_code}>
                        {country.flag} {country.dial_code}
                      </option>
                    ))}
                  </select>
                  <input 
                    id="phone" 
                    type="tel" 
                    placeholder="987 654 321" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className={`${inputBaseClasses} rounded-l-none`} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300">
                <div className="flex items-center justify-center gap-2">
                    Ingresar
                    <ArrowRight size={18} />
                </div>
              </button>
            </form>

          {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{error}</p>}

          <div className="lg:hidden mt-12"><FeatureList /></div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-white dark:bg-dark-surface p-8 sm:p-12 flex-col justify-center relative overflow-hidden order-1 lg:order-2 hidden lg:flex">
        <div className="w-full max-w-md mx-auto z-10">
          <div className="mb-8"><Logo /></div>
          <h2 className="text-4xl font-bold text-textPrimary dark:text-dark-textPrimary leading-tight mb-6">
            Potencia tus ventas con una gestión de cotizaciones todo-en-uno.
          </h2>
          <div className="w-full h-80 rounded-lg mb-8"><AppVisual /></div>
          <FeatureList />
        </div>
      </div>
    </div>
  );
};

export default Auth;
