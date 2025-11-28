import React from 'react';
import { X, Check, Crown, Zap, MessageCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { SystemConfig } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemConfig?: SystemConfig;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, systemConfig }) => {
  if (!isOpen) return null;

  const salesPhone = systemConfig?.salesPhoneNumber || '51944894541'; 
  const paymentPhone = systemConfig?.paymentPhoneNumber || '975615244';

  const handleSubscribe = () => {
    const message = `Hola Olivia SaaS! 👋 Quiero activar mi Plan PRO 🚀.\n\nAdjunto mi comprobante de pago por Yape/Plin al número: ${paymentPhone}`;
    const cleanSalesPhone = salesPhone.replace(/\D/g, ''); 
    const url = `https://wa.me/${cleanSalesPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      
      {/* Modal Container - Height Constrained with Flex Column */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90dvh] animate-slide-up">
        
        {/* Left Side: Visual (Hidden on Mobile to save space) */}
        <div className="hidden md:flex w-2/5 bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-white flex-col justify-between relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider mb-6">
                    <Crown size={14} className="text-yellow-400" />
                    Premium
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Lleva tu negocio al siguiente nivel.</h2>
                <p className="text-indigo-200 text-sm">Desbloquea todo el potencial de Olivia y vende sin límites.</p>
            </div>
            
            <div className="relative z-10 mt-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Zap size={20} className="text-yellow-400"/></div>
                    <div>
                        <p className="font-bold text-sm">Sin Límites</p>
                        <p className="text-xs text-indigo-200">Cotizaciones ilimitadas.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><ShieldCheck size={20} className="text-green-400"/></div>
                    <div>
                        <p className="font-bold text-sm">Tu Marca Propia</p>
                        <p className="text-xs text-indigo-200">Sin marca de agua de Olivia.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Content (Scrollable Body, Fixed Header/Footer) */}
        <div className="flex-1 flex flex-col w-full md:w-3/5 bg-white dark:bg-zinc-900 min-h-0">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Elige tu Plan</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                    {/* Free Plan */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                        <div>
                             <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Plan Actual</h4>
                             <p className="text-lg font-bold text-gray-900 dark:text-white">Gratis</p>
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-right">
                            <li>5 Cotizaciones/mes</li>
                            <li>Con Marca de Agua</li>
                        </ul>
                    </div>

                    {/* Pro Plan (Highlighted) */}
                    <div className="border-2 border-primary rounded-xl p-5 relative bg-primary/5 shadow-md">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Recomendado
                        </div>
                        <div className="flex justify-between items-end mb-4">
                             <div>
                                <h4 className="font-bold text-primary uppercase text-xs tracking-wider mb-1">Plan PRO</h4>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">S/ 29.90</span>
                                    <span className="text-xs text-gray-500">/mes</span>
                                </div>
                             </div>
                        </div>
                        
                        <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <li className="flex items-center gap-2"><div className="p-0.5 bg-green-100 rounded-full"><Check size={12} className="text-green-600"/></div> <span className="font-bold">Ilimitadas</span> Cotizaciones</li>
                            <li className="flex items-center gap-2"><div className="p-0.5 bg-green-100 rounded-full"><Check size={12} className="text-green-600"/></div> IA Ilimitada</li>
                            <li className="flex items-center gap-2"><div className="p-0.5 bg-green-100 rounded-full"><Check size={12} className="text-green-600"/></div> Envío directo por WhatsApp</li>
                            <li className="flex items-center gap-2"><div className="p-0.5 bg-green-100 rounded-full"><Check size={12} className="text-green-600"/></div> Sin marca de agua</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Métodos de Pago Aceptados</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                            <div className="bg-purple-600 text-white p-1.5 rounded shadow-sm"><CreditCard size={16}/></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white text-xs">Yape / Plin</p>
                                <p className="text-xs text-gray-500 font-mono">{paymentPhone}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                            <div className="bg-blue-600 text-white p-1.5 rounded shadow-sm"><CreditCard size={16}/></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white text-xs">BCP</p>
                                <p className="text-xs text-gray-500">Transferencia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 shrink-0 z-10">
                <button 
                    onClick={handleSubscribe}
                    className="w-full py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 animate-pulse"
                >
                    <MessageCircle size={20} />
                    <span>Confirmar y Activar por WhatsApp</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;