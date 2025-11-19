
import React, { useState } from 'react';
import { Sparkles, FileText, Send, ArrowRight, UserPlus, Briefcase, User, Phone, KeyRound, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import Spinner from './Spinner';
import { getUserByPhone, registerNewUser, verifyUserOTP } from '../services/supabaseClient';
import { User as AppUser } from '../types';

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
  { code: 'MX', name: 'México', dial_code: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dial_code: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dial_code: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', dial_code: '+54', flag: '🇦🇷' },
];

interface AuthProps {
  onLogin: (user: AppUser) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'check_phone' | 'register' | 'verify_otp'>('check_phone');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+51');
  
  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to get full international number
  const getFullPhone = () => {
      const cleanNumber = phone.replace(/\D/g, '');
      const cleanCode = countryCode.replace('+', '');
      return `${cleanCode}${cleanNumber}`;
  };

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) { // Basic validation
        setError('Por favor ingresa un número válido.');
        setLoading(false);
        return;
    }
    
    const fullPhone = getFullPhone();

    try {
        const existingUser = await getUserByPhone(fullPhone); 
        
        if (existingUser) {
            if (existingUser.is_verified === false) {
                // User exists but verification pending (interrupted flow)
                // In a real app we would resend OTP here. For now, we assume they might have it or need to re-register
                // Let's re-register them to trigger a new OTP
                 setStep('register'); // Go to register to update details and trigger new OTP
            } else {
                // Login successful
                onLogin(existingUser);
            }
        } else {
            // User not found, go to registration
            setStep('register');
        }
    } catch (err) {
        console.error(err);
        setError('Hubo un problema de conexión. Intenta de nuevo.');
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if(!fullName.trim() || !companyName.trim()) {
          setError('Todos los campos son obligatorios');
          return;
      }

      setLoading(true);

      try {
          const fullPhone = getFullPhone();
          const { user: newUser, alreadyVerified } = await registerNewUser({
              fullName,
              companyName,
              phone: fullPhone
          });
          
          if (alreadyVerified) {
              onLogin(newUser);
          } else {
              setTempUserId(newUser.id);
              setStep('verify_otp');
          }
      } catch (err: any) {
          console.error(err);
          setError(err.message || 'Error al registrar usuario.');
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      if (!tempUserId) {
          setError("Error de sesión. Por favor intenta registrarte de nuevo.");
          setStep('register');
          setLoading(false);
          return;
      }

      try {
          const isValid = await verifyUserOTP(tempUserId, otp);
          if (isValid) {
              // Fetch full user to login
              const fullPhone = getFullPhone();
              const user = await getUserByPhone(fullPhone);
              if (user) {
                  onLogin(user);
              } else {
                  throw new Error("Error recuperando usuario verificado.");
              }
          } else {
              setError("Código incorrecto. Por favor verifica el mensaje en WhatsApp.");
          }
      } catch (err: any) {
          console.error(err);
          setError("Error al verificar código.");
      } finally {
          setLoading(false);
      }
  }

  const inputBaseClasses = "w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";
  const labelClasses = "block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary">
      {loading && <Spinner message={
          step === 'check_phone' ? "Verificando..." : 
          step === 'register' ? "Enviando código por WhatsApp..." :
          "Validando llave..."
      } />}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          
          {step === 'check_phone' && (
              <>
                <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4">
                    Bienvenido a Olivia
                </h1>
                
                {/* Highlighted Instruction Box */}
                <div className="mb-8 p-6 bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-700 rounded-xl shadow-md text-center relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-primary"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                        Ingresa tu número de celular para <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">acceder</span> o <span className="text-primary dark:text-dark-primary font-bold text-xl">crear tu cuenta</span>.
                    </p>
                </div>
                
                <form className="space-y-6" onSubmit={handleCheckPhone}>
                    <div>
                        <label htmlFor="phone" className={labelClasses}>Tu número de celular</label>
                        <div className="flex">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className={`${inputBaseClasses} w-auto rounded-r-none pr-8 appearance-none border-r-0 bg-gray-50 dark:bg-white/5 cursor-pointer`}
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
                            Continuar
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </form>
              </>
          )}

          {step === 'register' && (
              <>
                <div className="mb-4">
                    <button onClick={() => setStep('check_phone')} className="text-sm text-textSecondary hover:text-primary flex items-center gap-1"><ArrowRight className="rotate-180" size={14}/> Volver</button>
                </div>
                
                <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-2">
                    Crea tu cuenta
                </h1>
                <p className="text-textSecondary dark:text-dark-textSecondary mb-6">
                    ¡Es rápido! Completa estos datos para empezar.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6 flex items-center gap-3 border border-blue-100 dark:border-blue-900/30">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <Phone size={16} className="text-blue-600 dark:text-blue-300"/>
                    </div>
                    <div>
                        <p className="text-xs text-textSecondary dark:text-dark-textSecondary">Registrando número:</p>
                        <p className="font-bold text-textPrimary dark:text-dark-textPrimary">{countryCode} {phone}</p>
                    </div>
                </div>
                
                <form className="space-y-5" onSubmit={handleRegister}>
                    <div>
                        <label className={labelClasses}>Nombre Completo</label>
                        <div className="relative">
                             <User className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                             <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={`${inputBaseClasses} pl-10`} placeholder="Ej. Juan Pérez" required/>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Nombre de tu Negocio</label>
                        <div className="relative">
                             <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                             <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={`${inputBaseClasses} pl-10`} placeholder="Ej. Bodega Juan" required/>
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full py-3 font-bold text-white bg-accent-teal rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300">
                            <div className="flex items-center justify-center gap-2">
                                <UserPlus size={18} />
                                Enviar Código
                            </div>
                        </button>
                    </div>
                </form>
              </>
          )}

          {step === 'verify_otp' && (
              <>
                 <div className="mb-4">
                    <button onClick={() => setStep('register')} className="text-sm text-textSecondary hover:text-primary flex items-center gap-1"><ArrowRight className="rotate-180" size={14}/> Corregir datos</button>
                </div>

                 <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4">
                    Verifica tu cuenta
                </h1>
                <p className="text-textSecondary dark:text-dark-textSecondary mb-8">
                    Hemos enviado una <strong>Llave de Seguridad</strong> de 6 dígitos a tu WhatsApp. Ingrésala para continuar.
                </p>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl mb-8 border border-green-100 dark:border-green-900/30 flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mt-1">
                        <CheckCircle2 size={20} className="text-green-600 dark:text-green-300"/>
                    </div>
                     <div>
                        <p className="font-semibold text-green-800 dark:text-green-300">Mensaje Enviado</p>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">Revisa tu WhatsApp, el código debería llegar en unos segundos.</p>
                    </div>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div>
                        <label className={labelClasses}>Llave de 6 Dígitos</label>
                        <div className="relative">
                             <KeyRound className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                             <input 
                                type="text" 
                                value={otp} 
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                }} 
                                className={`${inputBaseClasses} pl-10 text-2xl tracking-widest font-mono`} 
                                placeholder="000000" 
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={otp.length < 6} className="w-full py-3 font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="flex items-center justify-center gap-2">
                            Validar y Entrar
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </form>
              </>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-500/10 p-3 rounded-lg animate-pulse">{error}</p>}

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
