
import React, { useState } from 'react';
import { Plus, X, Bell, Calendar, CheckCircle, Loader2, Bot, Sparkles } from 'lucide-react';
import { User } from '../types';
import { saveQuotation, updateQuotationTags } from '../services/supabaseClient';

interface QuickTaskFabProps {
  user: User;
}

const QuickTaskFab: React.FC<QuickTaskFabProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !date) return;

    setLoading(true);
    try {
        // 1. Crear una estructura de cotización "Fantasma" para el recordatorio
        const quoteId = await saveQuotation(
            user.id,
            { 
                name: "Mis Recordatorios", // Cliente especial
                phone: user.phone,         // Tu propio teléfono
                email: user.email 
            },
            {
                number: "NOTE-" + Date.now().toString().slice(-6), // ID único temporal
                total: 0,
                currency: 'S/',
                items: [{ 
                    id: 'note-1', 
                    description: note, // La nota va aquí
                    quantity: 1, 
                    unitPrice: 0 
                }]
            },
            'draft' // Se guarda como borrador para no afectar métricas de ventas
        );

        // 2. Asignar la etiqueta de Tarea y la fecha para que n8n lo detecte
        await updateQuotationTags(
            quoteId, 
            ['task'], 
            { 
                next_followup: date,
                notes: note
            }
        );

        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setIsOpen(false);
            setNote('');
            setDate('');
        }, 2000);

    } catch (error) {
        console.error("Error saving quick task:", error);
        alert("No se pudo guardar el recordatorio.");
    } finally {
        setLoading(false);
    }
  };

  // Cálculo visual para el usuario
  const getReminderText = () => {
      if (!date) return null;
      const eventTime = new Date(date);
      const reminderTime = new Date(eventTime.getTime() - 30 * 60000); // 30 min antes
      return `Te avisaré a las ${reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-8 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bg-primary text-white hover:bg-pink-600 hover:scale-105`}
        title="Abrir Oliv-IA"
      >
        <div className="relative">
            <Bot size={28} />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold shadow-sm">
            Oliv-IA
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="relative w-full sm:w-96 bg-surface dark:bg-dark-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                        <Bot size={20} />
                    </div>
                    <h3 className="font-bold text-lg tracking-wide">Oliv-IA</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-500 animate-fade-in">
                        <CheckCircle size={48} className="mb-3" />
                        <p className="font-bold text-lg">¡Anotado!</p>
                        <p className="text-sm text-textSecondary text-center mt-1">Te enviaré un WhatsApp 30 min antes.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1.5">
                                ¿Qué necesitas recordar?
                            </label>
                            <input 
                                type="text" 
                                autoFocus
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ej. Pagar recibo de luz..."
                                className="w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-textPrimary dark:text-dark-textPrimary transition-all"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1.5">
                                ¿Cuándo es el evento?
                            </label>
                            <div className="relative">
                                <input 
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-textPrimary dark:text-dark-textPrimary transition-all"
                                />
                                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            </div>
                            {date && (
                                <p className="text-xs text-primary dark:text-pink-400 mt-2 flex items-center gap-1 bg-primary/5 dark:bg-primary/10 p-2 rounded-lg">
                                    <Bell size={12} />
                                    {getReminderText()} (30 min antes)
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={!note || !date || loading}
                            className="w-full py-3.5 bg-primary hover:bg-pink-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                            Crear Recordatorio
                        </button>
                    </form>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickTaskFab;
