
import React, { useState } from 'react';
import { User } from '../types';
import { completeOnboarding, updateUserSettings } from '../services/supabaseClient';
import { PartyPopper, Building, Palette, CheckCircle, ArrowRight } from 'lucide-react';

interface OnboardingPageProps {
  user: User;
  onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [config, setConfig] = useState({
      address: '',
      color: '#EC4899',
      logo: null as string | null
  });

  const handleNext = () => setStep(s => s + 1);

  const handleFinish = async () => {
      setLoading(true);
      
      // Construct the settings object
      const defaultSettings = {
        companyName: user.companyName,
        companyLogo: config.logo,
        companyAddress: config.address,
        themeColor: config.color,
        // Default values
        companyPhone: user.phone,
        quotationPrefix: 'COT-',
        quotationNextNumber: 1,
        currencySymbol: 'S/',
        defaultMarginType: 'percentage' as any,
        defaultMarginValue: 20,
        defaultTemplate: 'modern' as any,
        paymentTerms: [],
        paymentMethods: [],
        taxType: 'included' as any,
        taxRate: 18,
        companyDocumentType: '',
        companyDocumentNumber: '',
        companyEmail: '',
        companyWebsite: '',
        headerImage: null,
        quotationPadding: 6
      };

      try {
          // 1. Save to Cloud
          await updateUserSettings(user.id, defaultSettings);
          
          // 2. Save to Local Storage (as backup/cache)
          localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(defaultSettings));

          // 3. Mark onboarding as complete
          await completeOnboarding(user.id);
          
          onComplete();
      } catch (e) {
          console.error("Onboarding save failed", e);
          alert("Hubo un problema guardando la configuración. Intenta de nuevo.");
      } finally {
          setLoading(false);
      }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface dark:bg-dark-surface rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden">
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
            <div 
                className="bg-primary h-2 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
            ></div>
        </div>

        <div className="p-8 sm:p-10 text-center">
            {step === 1 && (
                <div className="animate-fade-in">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <PartyPopper size={40} className="text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-3">
                        ¡Felicidades, {user.fullName.split(' ')[0]}!
                    </h1>
                    <p className="text-textSecondary dark:text-dark-textSecondary text-lg mb-8">
                        Has dado el primer paso para transformar <strong>{user.companyName}</strong>. Vamos a configurar tu espacio de trabajo en menos de 1 minuto.
                    </p>
                    <button onClick={handleNext} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">
                        Comenzar
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in text-left">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Building size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Datos del Negocio</h2>
                     </div>
                     
                     <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Dirección Comercial (Opcional)</label>
                            <input 
                                type="text" 
                                value={config.address}
                                onChange={(e) => setConfig({...config, address: e.target.value})}
                                placeholder="Ej. Av. Principal 123"
                                className="w-full px-4 py-3 rounded-lg bg-background dark:bg-dark-background border border-border dark:border-dark-border focus:ring-2 focus:ring-primary outline-none text-textPrimary dark:text-dark-textPrimary"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Logo del Negocio</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-background dark:bg-dark-background">
                                    {config.logo ? <img src={config.logo} className="w-full h-full object-contain"/> : <span className="text-xs text-gray-400">Logo</span>}
                                </div>
                                <label className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 text-sm font-semibold text-textPrimary dark:text-dark-textPrimary transition">
                                    Subir Imagen
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                                </label>
                            </div>
                        </div>
                     </div>

                     <button onClick={handleNext} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        Siguiente <ArrowRight size={20}/>
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in text-left">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600"><Palette size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Personaliza tu Marca</h2>
                     </div>
                     
                     <p className="text-sm text-textSecondary dark:text-dark-textSecondary mb-4">Elige el color principal que aparecerá en tus cotizaciones.</p>

                     <div className="grid grid-cols-5 gap-3 mb-8">
                        {['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(c => (
                            <button
                                key={c}
                                onClick={() => setConfig({...config, color: c})}
                                className={`w-12 h-12 rounded-full transition-transform ${config.color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <input 
                            type="color" 
                            value={config.color}
                            onChange={(e) => setConfig({...config, color: e.target.value})}
                            className="w-12 h-12 rounded-full p-0 border-0 overflow-hidden cursor-pointer"
                        />
                     </div>

                     <button 
                        onClick={handleFinish} 
                        disabled={loading}
                        className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <CheckCircle size={20}/>
                                Finalizar Configuración
                            </>
                        )}
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
