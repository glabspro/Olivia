
import React, { useState } from 'react';
import { Plus, X, Bell, Calendar, CheckCircle, Loader2, Bot, Sparkles, Phone, Briefcase, AlertTriangle, Mail, FileText, Star, Send, Zap } from 'lucide-react';
import { User } from '../types';
import { createTask, triggerTaskAutomation } from '../services/supabaseClient';

interface QuickTaskFabProps {
  user: User;
}

type TaskType = 'note' | 'call' | 'meeting' | 'urgent' | 'email';

const QuickTaskFab: React.FC<QuickTaskFabProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('note');
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Email Validation Helper
  const hasValidEmail = (text: string) => /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.test(text);
  
  // Check Settings for Cal.com
  const hasCalLink = !!user.settings?.calComLink;

  const isFormValid = () => {
      if (taskType === 'email') return note.length > 0 && hasValidEmail(note);
      if (taskType === 'meeting') return note.length > 0 && hasCalLink;
      return note.length > 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
        // Logic: Clean any existing prefix to avoid double prefixes
        const cleanNote = note.replace(/^(SEND:|MEET:|CALL:|URGENT:|NOTE:|⚠️|📝|📞|📅|✉️)\s*/i, '').trim();
        
        let finalDescription = cleanNote;
        let finalDate = date ? new Date(date).toISOString() : undefined;
        let isImmediateAction = false;

        // Construct Description based on Type
        switch (taskType) {
            case 'call': 
                finalDescription = `CALL: ${cleanNote}`; 
                break;
            case 'meeting': 
                finalDescription = `MEET: ${cleanNote}`; 
                isImmediateAction = true;
                break;
            case 'email': 
                finalDescription = `SEND: ${cleanNote}`; 
                isImmediateAction = true;
                // If no date set for email, default to "Now + 2 min" so n8n picks it up
                if (!date) {
                    finalDate = new Date(Date.now() + 2 * 60000).toISOString();
                }
                break;
            case 'urgent': 
                finalDescription = `⚠️ ${cleanNote}`; 
                break;
            case 'note': 
                finalDescription = `📝 ${cleanNote}`; 
                break;
        }

        // 1. Trigger Automation (Immediate Action)
        if (isImmediateAction || taskType === 'urgent') {
             await triggerTaskAutomation(user, {
                type: taskType,
                description: finalDescription,
                date: finalDate || new Date().toISOString()
            });
        }

        // 2. Save to Supabase (Audit Trail / History)
        await createTask(user.id, finalDescription, finalDate, isImportant);

        // 3. UI Feedback
        if (isImmediateAction) {
            setActionMessage(taskType === 'meeting' ? '¡Invitación Enviada!' : '¡Correo en cola de envío!');
        } else {
            setActionMessage('¡Anotado!');
        }

        setSuccess(true);
        setTimeout(() => {
            handleClose(); 
        }, 2000);

    } catch (error) {
        console.error("Error saving quick task:", error);
        alert("Hubo un problema al procesar la acción.");
        setLoading(false);
    }
  };

  const getReminderText = () => {
      if (!date) return null;
      const eventTime = new Date(date);
      const reminderTime = new Date(eventTime.getTime() - 30 * 60000); // 30 min antes
      return `Te avisaré a las ${reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const openModal = () => {
      setNote('');
      setDate('');
      setTaskType('note');
      setIsImportant(false);
      setSuccess(false);
      setActionMessage('');
      setIsOpen(true);
  };

  const handleClose = () => {
      setIsOpen(false);
      setTimeout(() => {
          setNote('');
          setDate('');
          setTaskType('note');
          setIsImportant(false);
          setSuccess(false);
          setLoading(false);
          setActionMessage('');
      }, 300);
  };

  const handleTypeSelect = (type: TaskType) => {
      setTaskType(type);
      // Limpiar prefijos si el usuario cambia de tipo, manteniendo el texto
      let cleanNote = note.replace(/^(SEND:|MEET:|CALL:|URGENT:|NOTE:|⚠️|📝|📞|📅|✉️)\s*/i, '').trim();
      setNote(cleanNote);
  };
  
  // Dynamic UI Labels
  const getPlaceholder = () => {
      switch(taskType) {
          case 'call': return 'Ej. Juan Pérez...';
          case 'meeting': return 'Ej. Carlos (Cliente Nuevo)...';
          case 'email': return 'Ej. Enviar presupuesto a cliente@empresa.com...';
          case 'urgent': return 'Ej. Pagar servicios hoy...';
          default: return 'Escribe una nota rápida...';
      }
  }

  const getInputLabel = () => {
      switch(taskType) {
          case 'call': return '¿A quién hay que llamar?';
          case 'meeting': return '¿Con quién es la reunión? (Nombre del Cliente)';
          case 'email': return 'Instrucción (Obligatorio incluir email)';
          case 'urgent': return '¿Cuál es la urgencia?';
          default: return '¿Qué necesitas recordar?';
      }
  }

  const getButtonLabel = () => {
      if (loading) return 'Procesando...';
      switch(taskType) {
          case 'email': return 'Enviar Correo Ahora';
          case 'meeting': return 'Enviar Invitación WhatsApp';
          case 'call': return 'Agendar Llamada';
          default: return 'Guardar Nota';
      }
  }

  const taskTypes: { id: TaskType; label: string; icon: React.ElementType; color: string, activeColor: string }[] = [
      { id: 'note', label: 'Nota', icon: FileText, color: 'text-gray-500', activeColor: 'bg-gray-100 text-gray-700 border-gray-300' },
      { id: 'meeting', label: 'Reunión', icon: Zap, color: 'text-purple-500', activeColor: 'bg-purple-100 text-purple-700 border-purple-300' },
      { id: 'email', label: 'Correo', icon: Mail, color: 'text-orange-500', activeColor: 'bg-orange-100 text-orange-700 border-orange-300' },
      { id: 'call', label: 'Llamar', icon: Phone, color: 'text-blue-500', activeColor: 'bg-blue-100 text-blue-700 border-blue-300' },
      { id: 'urgent', label: 'Urgente', icon: AlertTriangle, color: 'text-red-500', activeColor: 'bg-red-100 text-red-700 border-red-300' },
  ];

  const isActionType = taskType === 'email' || taskType === 'meeting';

  return (
    <>
      <button
        onClick={openModal}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={handleClose}
          ></div>
          
          <div className="relative w-full sm:w-96 bg-surface dark:bg-dark-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-slide-up">
            
            <div className={`${isActionType ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-primary'} p-4 flex justify-between items-center text-white transition-colors duration-300`}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg tracking-wide leading-none">Oliv-IA</h3>
                        <span className="text-[10px] opacity-80 font-medium">{isActionType ? 'Modo Acción Rápida' : 'Asistente Personal'}</span>
                    </div>
                </div>
                <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-500 animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3 animate-bounce">
                            <CheckCircle size={32} />
                        </div>
                        <p className="font-bold text-xl text-textPrimary dark:text-dark-textPrimary">{actionMessage}</p>
                        <p className="text-sm text-textSecondary text-center mt-1">Procesado exitosamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-textSecondary dark:text-dark-textSecondary mb-2 uppercase tracking-wider">
                                ¿Qué quieres hacer?
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {taskTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleTypeSelect(type.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-all border ${
                                            taskType === type.id 
                                            ? type.activeColor 
                                            : `border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 ${type.color}`
                                        }`}
                                    >
                                        <div className="mb-1">
                                            <type.icon size={20} />
                                        </div>
                                        <span className="text-[10px] font-bold">
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-border dark:border-dark-border">
                            <label className="block text-xs font-bold text-textPrimary dark:text-dark-textPrimary mb-1.5 ml-1">
                                {getInputLabel()}
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={getPlaceholder()}
                                    className={`w-full px-4 py-3 pr-10 bg-white dark:bg-dark-background border rounded-lg focus:ring-2 outline-none text-textPrimary dark:text-dark-textPrimary transition-all shadow-sm ${
                                        taskType === 'email' && note.length > 0 && !hasValidEmail(note)
                                        ? 'border-red-300 focus:ring-red-200'
                                        : 'border-border dark:border-dark-border focus:ring-primary/50'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsImportant(!isImportant)}
                                    className={`absolute right-3 top-3.5 transition-colors ${isImportant ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                                    title="Marcar como importante"
                                >
                                    <Star size={20} fill={isImportant ? "currentColor" : "none"} />
                                </button>
                            </div>
                            
                            {/* Smart Feedback Messages */}
                            {taskType === 'email' && (
                                <p className={`text-[10px] mt-2 flex items-center gap-1.5 ${(!note || hasValidEmail(note)) ? 'text-textSecondary' : 'text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-1.5 rounded'}`}>
                                    <Mail size={12}/>
                                    {(!note || hasValidEmail(note)) 
                                        ? "Escribe la instrucción y el correo del destinatario." 
                                        : "⚠️ Falta un email válido (ej. @gmail.com)"}
                                </p>
                            )}
                            {taskType === 'meeting' && (
                                <div className="mt-2">
                                    {!hasCalLink ? (
                                        <p className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-1">
                                            <AlertTriangle size={12}/> Configura tu link de Cal.com en Ajustes para usar esto.
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded flex items-center gap-1">
                                            <Zap size={12}/>
                                            Se enviará tu link de agenda por WhatsApp al instante.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {!isActionType && (
                            <div>
                                <label className="block text-xs font-bold text-textSecondary dark:text-dark-textSecondary mb-1.5 ml-1">
                                    Fecha y Hora (Opcional)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="datetime-local"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-white/5 border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-textPrimary dark:text-dark-textPrimary transition-all text-sm"
                                    />
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={!isFormValid() || loading}
                            className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 ${
                                isActionType 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                                : 'bg-primary hover:bg-pink-600 text-white'
                            }`}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (isActionType ? <Send size={18}/> : <CheckCircle size={18} />)}
                            {getButtonLabel()}
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
