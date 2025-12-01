
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

  // Default Fallbacks using the specific numbers requested by user
  // This ensures it works even if Admin config hasn't been touched yet
  const salesPhone = systemConfig?.salesPhoneNumber || '51944894541'; 
  const paymentPhone = systemConfig?.paymentPhoneNumber || '975615244';

  const handleSubscribe = () => {
    const message = `Hola Olivia SaaS! 👋 Quiero activar mi Plan PRO 🚀.\n\nAdjunto mi comprobante de pago por Yape/Plin al número: ${paymentPhone}`;
    // Ensure clean number format for WhatsApp link
    const cleanSalesPhone = salesPhone.replace(/\D/g, ''); 
    const url = `https://wa.me/${cleanSalesPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 rounded-full transition-colors"
        >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Left Side: Visual / Value Prop */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
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

        {/* Right Side: Plans */}
        <div className="w-full md:w-3/5 p-8 bg-white dark:bg-zinc-900">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Elige tu Plan</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Free Plan */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative opacity-70 hover:opacity-100 transition-opacity">
                    <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Plan Actual</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">Gratis</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2"><Check size={14}/> 5 Cotizaciones/mes</li>
                        <li className="flex items-center gap-2"><Check size={14}/> 2 Usos de IA</li>
                        <li className="flex items-center gap-2 text-gray-400"><X size={14}/> Marca de agua</li>
                    </ul>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-primary rounded-xl p-5 relative bg-primary/5 shadow-xl scale-105 transform">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Recomendado
                    </div>
                    <h4 className="font-bold text-primary uppercase text-xs tracking-wider mb-2">Plan PRO</h4>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">S/ 29.90</span>
                        <span className="text-xs text-gray-500">/mes</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> <strong>Ilimitadas</strong> Cotizaciones</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> IA Ilimitada</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Envío directo por WhatsApp</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Sin marca de agua</li>
                    </ul>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Método de Activación Rápida</p>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                         <div className="bg-purple-600 text-white p-1.5 rounded"><CreditCard size={16}/></div>
                         <div>
                             <p className="text-xs font-bold text-gray-900 dark:text-white">Yape / Plin</p>
                             <p className="text-xs text-gray-500 font-mono select-all cursor-pointer hover:text-primary">{paymentPhone}</p>
                         </div>
                    </div>
                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                     <div className="flex items-center gap-2">
                         <div className="bg-blue-600 text-white p-1.5 rounded"><CreditCard size={16}/></div>
                         <div>
                             <p className="text-xs font-bold text-gray-900 dark:text-white">BCP</p>
                             <p className="text-xs text-gray-500">Solicitar CCI</p>
                         </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSubscribe}
                className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
            >
                <MessageCircle size={24} />
                <span>Activar por WhatsApp</span>
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-3">
                Al hacer clic, se abrirá un chat con nuestro soporte para validar tu pago.
            </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
