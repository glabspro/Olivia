import React, { useState } from 'react';
import { Sparkles, FileText, Send, Mail } from 'lucide-react';
import Logo from './Logo';
import { supabase } from '../services/supabaseClient';
import Spinner from './Spinner';

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

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!supabase) throw new Error("Cliente de Supabase no inicializado.");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // Redirects back to your app
        },
      });

      if (error) throw error;
      setMessage('¡Listo! Revisa tu correo electrónico para encontrar el enlace de acceso.');

    } catch (err: any) {
      console.error("Error en el inicio de sesión:", err);
      setError(err.error_description || err.message || 'No se pudo enviar el enlace. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const inputBaseClasses = "w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";
  const labelClasses = "block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary">
      {loading && <Spinner message="Procesando..." />}
      {/* Column 1: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          
          <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-2">
            Accede a tu cuenta
          </h1>
          <p className="text-textSecondary dark:text-dark-textSecondary mb-8">
            Ingresa tu correo para recibir un enlace de acceso mágico. Sin contraseñas.
          </p>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className={labelClasses}>Tu correo electrónico</label>
              <input 
                id="email" 
                type="email" 
                placeholder="ej: tu@empresa.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className={inputBaseClasses} 
                required 
              />
            </div>
            <button type="submit" className="w-full py-3 font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300">
              <div className="flex items-center justify-center gap-2">
                  <Mail size={18}/> Enviar enlace de acceso
              </div>
            </button>
          </form>

          {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          {message && <p className="mt-4 text-center text-sm text-green-600 bg-green-500/10 p-3 rounded-lg">{message}</p>}

          <div className="lg:hidden mt-12"><FeatureList /></div>
        </div>
      </div>

      {/* Column 2: Marketing */}
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
