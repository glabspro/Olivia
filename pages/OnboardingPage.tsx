
import React, { useState } from 'react';
import { User, TaxType, MarginType, Template } from '../types';
import { completeOnboarding, updateUserSettings } from '../services/supabaseClient';
import { PartyPopper, Building, Palette, CheckCircle, ArrowRight, ArrowLeft, CreditCard, Calendar, Hash, ExternalLink, HelpCircle } from 'lucide-react';

interface OnboardingPageProps {
  user: User;
  onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Configuration State
  const [config, setConfig] = useState({
      // Brand
      color: '#EC4899',
      logo: null as string | null,
      
      // Legal / Identity
      companyName: user.companyName,
      docType: 'RUC' as 'RUC' | 'DNI' | '',
      docNumber: '',
      address: '',
      currency: 'S/',
      taxType: 'included' as TaxType,
      taxRate: 18,

      // Payments
      bankName: '',
      bankAccount: '',
      yapeNumber: '',

      // Automation
      calComLink: '',

      // Series
      prefix: 'COT-',
      startNumber: 1
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
      setLoading(true);
      
      // Construct the payment methods/terms based on input
      const paymentMethods = [];
      if (config.bankName && config.bankAccount) {
          paymentMethods.push({
              id: 'method-bank',
              name: 'Transferencia Bancaria',
              details: `${config.bankName}\nCuenta: ${config.bankAccount}\nTitular: ${config.companyName}`
          });
      }
      if (config.yapeNumber) {
          paymentMethods.push({
              id: 'method-wallet',
              name: 'Billetera Digital',
              details: `Yape / Plin: ${config.yapeNumber}\nTitular: ${config.companyName}`
          });
      }
      // Add default if nothing added
      if (paymentMethods.length === 0) {
           paymentMethods.push({
              id: 'method-default',
              name: 'Coordinar Pago',
              details: 'Contactar para detalles de pago.'
           });
      }

      const defaultSettings = {
        companyName: config.companyName,
        companyLogo: config.logo,
        companyAddress: config.address,
        companyDocumentType: config.docType,
        companyDocumentNumber: config.docNumber,
        companyPhone: user.phone,
        companyEmail: user.email,
        companyWebsite: '',
        
        currencySymbol: config.currency,
        taxType: config.taxType,
        taxRate: config.taxRate,
        
        themeColor: config.color,
        
        quotationPrefix: config.prefix,
        quotationNextNumber: Number(config.startNumber),
        quotationPadding: 6,
        
        defaultMarginType: MarginType.PERCENTAGE,
        defaultMarginValue: 20,
        defaultTemplate: Template.MODERN,
        
        paymentTerms: [{ id: 'term-cash', name: 'Contado', details: 'Pago al 100% contra entrega.' }],
        paymentMethods: paymentMethods,
        
        headerImage: null,
        calComLink: config.calComLink.replace(/^https?:\/\//, '') // Clean link
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

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-background dark:bg-dark-background border border-border dark:border-dark-border focus:ring-2 focus:ring-primary outline-none text-textPrimary dark:text-dark-textPrimary transition-all";
  const labelClasses = "block text-sm font-bold text-textSecondary dark:text-dark-textSecondary mb-1.5";

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-surface dark:bg-dark-surface rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header / Progress */}
        <div className="px-8 py-6 border-b border-border dark:border-dark-border bg-gray-50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 6 ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                    {step < 6 ? step : <CheckCircle size={18}/>}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary uppercase tracking-wider">Configuración Inicial</h2>
                    <p className="text-xs text-textSecondary">Paso {step} de 5</p>
                </div>
            </div>
            {step > 1 && step < 6 && (
                <button onClick={handleFinish} className="text-xs font-semibold text-textSecondary hover:text-primary underline">
                    Omitir y finalizar
                </button>
            )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
            <div 
                className="bg-primary h-1 transition-all duration-500"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
            ></div>
        </div>

        <div className="p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-grow">
            
            {/* STEP 1: WELCOME & BRAND */}
            {step === 1 && (
                <div className="animate-fade-in text-center">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <PartyPopper size={40} className="text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary mb-3">
                        ¡Hola, {user.fullName.split(' ')[0]}!
                    </h1>
                    <p className="text-textSecondary dark:text-dark-textSecondary text-lg mb-8 max-w-md mx-auto">
                        Vamos a personalizar <strong>{user.companyName}</strong> para que tus cotizaciones se vean profesionales desde el primer día.
                    </p>
                    
                    <div className="text-left max-w-md mx-auto mb-8">
                         <label className={labelClasses}>Elige tu Color de Marca</label>
                         <div className="flex flex-wrap justify-center gap-4 mb-6">
                            {['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#000000'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setConfig({...config, color: c})}
                                    className={`w-10 h-10 rounded-full transition-transform shadow-sm ${config.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                         </div>

                         <label className={labelClasses}>Sube tu Logo (Opcional)</label>
                         <div className="flex items-center gap-4">
                            <div className="w-16 h-16 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-background dark:bg-dark-background shrink-0">
                                {config.logo ? <img src={config.logo} className="w-full h-full object-contain"/> : <span className="text-xs text-gray-400">Logo</span>}
                            </div>
                            <label className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 text-sm font-semibold text-textPrimary dark:text-dark-textPrimary transition text-center">
                                Seleccionar Imagen
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                            </label>
                        </div>
                    </div>

                    <button onClick={handleNext} className="w-full max-w-md mx-auto py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">
                        Continuar
                    </button>
                </div>
            )}

            {/* STEP 2: IDENTITY (LEGAL) */}
            {step === 2 && (
                <div className="animate-fade-in max-w-md mx-auto">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Building size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Identidad del Negocio</h2>
                     </div>
                     <p className="text-sm text-textSecondary mb-6">Estos datos aparecerán en el encabezado de tus PDFs para dar validez legal.</p>
                     
                     <div className="space-y-4 mb-8">
                        <div>
                            <label className={labelClasses}>Nombre Comercial / Razón Social</label>
                            <input type="text" value={config.companyName} onChange={(e) => setConfig({...config, companyName: e.target.value})} className={inputClasses} placeholder="Mi Empresa S.A.C."/>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                             <div className="col-span-1">
                                <label className={labelClasses}>Doc.</label>
                                <select value={config.docType} onChange={(e) => setConfig({...config, docType: e.target.value as any})} className={inputClasses}>
                                    <option value="RUC">RUC</option>
                                    <option value="DNI">DNI</option>
                                    <option value="">Otro</option>
                                </select>
                             </div>
                             <div className="col-span-2">
                                <label className={labelClasses}>Número</label>
                                <input type="text" value={config.docNumber} onChange={(e) => setConfig({...config, docNumber: e.target.value})} className={inputClasses} placeholder="2060..."/>
                             </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Dirección Fiscal</label>
                            <input type="text" value={config.address} onChange={(e) => setConfig({...config, address: e.target.value})} className={inputClasses} placeholder="Av. Principal 123, Lima"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className={labelClasses}>Moneda</label>
                                <input type="text" value={config.currency} onChange={(e) => setConfig({...config, currency: e.target.value})} className={inputClasses} placeholder="S/, $, €"/>
                             </div>
                             <div>
                                <label className={labelClasses}>Impuestos</label>
                                <select value={config.taxType} onChange={(e) => setConfig({...config, taxType: e.target.value as TaxType})} className={inputClasses}>
                                    <option value="included">Incluido en precio</option>
                                    <option value="added">Más IGV/IVA</option>
                                </select>
                             </div>
                        </div>
                     </div>

                     <div className="flex gap-3">
                        <button onClick={handleBack} className="px-6 py-3 border border-border rounded-xl text-textSecondary font-bold hover:bg-gray-50"><ArrowLeft size={20}/></button>
                        <button onClick={handleNext} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            Siguiente <ArrowRight size={20}/>
                        </button>
                     </div>
                </div>
            )}

            {/* STEP 3: PAYMENTS */}
            {step === 3 && (
                <div className="animate-fade-in max-w-md mx-auto">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><CreditCard size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Métodos de Pago</h2>
                     </div>
                     <p className="text-sm text-textSecondary mb-6">Facilita el cierre de ventas mostrando dónde pagar en la cotización.</p>
                     
                     <div className="space-y-6 mb-8">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-border dark:border-dark-border">
                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Building size={16}/> Cuenta Bancaria Principal</h4>
                            <div className="space-y-3">
                                <input type="text" value={config.bankName} onChange={(e) => setConfig({...config, bankName: e.target.value})} className={inputClasses} placeholder="Nombre del Banco (Ej. BCP)"/>
                                <input type="text" value={config.bankAccount} onChange={(e) => setConfig({...config, bankAccount: e.target.value})} className={inputClasses} placeholder="Nro. de Cuenta / CCI"/>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-border dark:border-dark-border">
                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><CreditCard size={16}/> Billetera Digital</h4>
                            <input type="text" value={config.yapeNumber} onChange={(e) => setConfig({...config, yapeNumber: e.target.value})} className={inputClasses} placeholder="Nro. Yape / Plin"/>
                        </div>
                     </div>

                     <div className="flex gap-3">
                        <button onClick={handleBack} className="px-6 py-3 border border-border rounded-xl text-textSecondary font-bold hover:bg-gray-50"><ArrowLeft size={20}/></button>
                        <button onClick={handleNext} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            Siguiente <ArrowRight size={20}/>
                        </button>
                     </div>
                </div>
            )}

            {/* STEP 4: CAL.COM INTEGRATION */}
            {step === 4 && (
                <div className="animate-fade-in max-w-md mx-auto">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><Calendar size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Agenda Inteligente</h2>
                     </div>
                     
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6 text-sm">
                        <p className="text-blue-800 dark:text-blue-200">
                            <strong>¿Por qué esto es importante?</strong><br/>
                            Olivia usa este enlace para que tus clientes agenden reuniones contigo automáticamente desde el chat.
                        </p>
                     </div>

                     <div className="space-y-4 mb-8">
                        <div>
                            <label className={labelClasses}>Tu enlace de Cal.com (u otro)</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-gray-100 dark:bg-white/5 text-gray-500 text-sm">
                                    https://
                                </span>
                                <input 
                                    type="text" 
                                    value={config.calComLink} 
                                    onChange={(e) => setConfig({...config, calComLink: e.target.value})} 
                                    className={`${inputClasses} rounded-l-none`}
                                    placeholder="cal.com/tu-usuario"
                                />
                            </div>
                        </div>

                        {!config.calComLink && (
                            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                                <p className="text-sm text-textSecondary mb-3">¿No tienes cuenta?</p>
                                <a 
                                    href="https://cal.com/signup" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-lg text-sm hover:opacity-90 transition"
                                >
                                    Crear cuenta gratis en Cal.com <ExternalLink size={14}/>
                                </a>
                                <p className="text-xs text-textSecondary mt-2">Es gratis y toma 2 minutos.</p>
                            </div>
                        )}
                     </div>

                     <div className="flex gap-3">
                        <button onClick={handleBack} className="px-6 py-3 border border-border rounded-xl text-textSecondary font-bold hover:bg-gray-50"><ArrowLeft size={20}/></button>
                        <button onClick={handleNext} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            {config.calComLink ? 'Siguiente' : 'Omitir por ahora'} <ArrowRight size={20}/>
                        </button>
                     </div>
                </div>
            )}

            {/* STEP 5: SERIES */}
            {step === 5 && (
                <div className="animate-fade-in max-w-md mx-auto">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600"><Hash size={24}/></div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Series y Numeración</h2>
                     </div>
                     <p className="text-sm text-textSecondary mb-6">Para continuar con el orden de tus documentos actuales.</p>
                     
                     <div className="space-y-6 mb-8">
                        <div>
                            <label className={labelClasses}>Prefijo de la Serie</label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <button onClick={() => setConfig({...config, prefix: 'COT-'})} className={`py-2 text-xs font-bold rounded-lg border ${config.prefix === 'COT-' ? 'bg-primary text-white border-primary' : 'bg-surface border-border'}`}>COT-</button>
                                <button onClick={() => setConfig({...config, prefix: 'F001-'})} className={`py-2 text-xs font-bold rounded-lg border ${config.prefix === 'F001-' ? 'bg-primary text-white border-primary' : 'bg-surface border-border'}`}>F001-</button>
                                <button onClick={() => setConfig({...config, prefix: 'B001-'})} className={`py-2 text-xs font-bold rounded-lg border ${config.prefix === 'B001-' ? 'bg-primary text-white border-primary' : 'bg-surface border-border'}`}>B001-</button>
                            </div>
                            <input type="text" value={config.prefix} onChange={(e) => setConfig({...config, prefix: e.target.value})} className={inputClasses} placeholder="Escribe tu prefijo..."/>
                        </div>

                        <div>
                            <label className={labelClasses}>Siguiente Número Correlativo</label>
                            <input type="number" value={config.startNumber} onChange={(e) => setConfig({...config, startNumber: Number(e.target.value)})} className={inputClasses}/>
                            <p className="text-xs text-textSecondary mt-2">
                                Tu próxima cotización será: <strong className="text-primary">{config.prefix}{String(config.startNumber).padStart(6, '0')}</strong>
                            </p>
                        </div>
                     </div>

                     <div className="flex gap-3">
                        <button onClick={handleBack} className="px-6 py-3 border border-border rounded-xl text-textSecondary font-bold hover:bg-gray-50"><ArrowLeft size={20}/></button>
                        <button 
                            onClick={handleFinish} 
                            disabled={loading}
                            className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <CheckCircle size={20}/>
                                    Finalizar Todo
                                </>
                            )}
                        </button>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;