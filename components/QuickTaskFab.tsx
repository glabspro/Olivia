
import React, { useState } from 'react';
import { Plus, X, Bell, Calendar, CheckCircle, Loader2, Bot, Sparkles, Phone, Briefcase, AlertTriangle, Mail, FileText, Star } from 'lucide-react';
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

  // Email Validation Helper
  const hasValidEmail = (text: string) => /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.test(text);
  const isFormValid = taskType === 'email' ? (note.length > 0 && hasValidEmail(note)) : note.length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
        // Logic: If user kept the prefix in the input, save as is. 
        // If they deleted it or typed plain text, append prefix based on selected type.
        let finalDescription = note;
        const hasPrefix = /^(SEND:|MEET:|CALL:|⚠️|📝)/.test(note);

        if (!hasPrefix) {
             switch (taskType) {
                case 'call': finalDescription = `CALL: ${note}`; break;
                case 'meeting': finalDescription = `MEET: ${note}`; break;
                case 'email': finalDescription = `SEND: ${note}`; break;
                case 'urgent': finalDescription = `⚠️ ${note}`; break;
                case 'note': finalDescription = `📝 ${note}`; break;
            }
        }
        
        // AUTO-DATE LOGIC FOR N8N POLLING:
        let finalDate = date ? new Date(date).toISOString() : undefined;
        
        if (!date && taskType === 'email') {
             // Emails usually need to be processed "soon" by n8n pollers that look for future dates
             const futureDate = new Date(Date.now() + 5 * 60000); // +5 minutos
             finalDate = futureDate.toISOString();
        } else if (date) {
             finalDate = new Date(date).toISOString();
        }

        // Save to Supabase
        await createTask(user.id, finalDescription, finalDate, isImportant);

        // Trigger n8n immediate webhook
        triggerTaskAutomation(user, {
            type: taskType,
            description: finalDescription,
            date: finalDate || new Date().toISOString()
        });

        setSuccess(true);
        setTimeout(() => {
            handleClose(); 
        }, 1500);

    } catch (error) {
        console.error("Error saving quick task:", error);
        alert("No se pudo guardar la tarea.");
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
      }, 300);
  };

  const handleTypeSelect = (type: TaskType) => {
      setTaskType(type);
      // Clean previous prefixes if switching types to keep UI clean
      let cleanNote = note.replace(/^(SEND:|MEET:|CALL:|⚠️|📝)\s*/, '');
      setNote(cleanNote);
  };
  
  // Dynamic UI Labels
  const getPlaceholder = () => {
      switch(taskType) {
          case 'call': return 'Ej. Juan Pérez (Ventas)...';
          case 'meeting': return 'Ej. Carlos (Nuevo Cliente)...';
          case 'email': return 'Ej. Presupuesto para cliente@gmail.com...';
          case 'urgent': return 'Ej. Pagar servicios hoy...';
          default: return 'Escribe una nota...';
      }
  }

  const getInputLabel = () => {
      switch(taskType) {
          case 'call': return '¿A quién hay que llamar?';
          case 'meeting': return '¿Con quién es la reunión? (Nombre)';
          case 'email': return 'Instrucción (debe incluir el email)';
          case 'urgent': return '¿Cuál es la urgencia?';
          default: return '¿Qué necesitas recordar?';
      }
  }

  const getButtonLabel = () => {
      if (loading) return null;
      switch(taskType) {
          case 'email': return 'Programar Correo';
          case 'meeting': return 'Agendar Reunión';
          case 'call': return 'Agendar Llamada';
          default: return 'Crear Recordatorio';
      }
  }

  const taskTypes: { id: TaskType; label: string; icon: React.ElementType; color: string }[] = [
      { id: 'note', label: 'Nota', icon: FileText, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
      { id: 'call', label: 'Llamar', icon: Phone, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { id: 'meeting', label: 'Reunión', icon: Briefcase, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
      { id: 'email', label: 'Correo', icon: Mail, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
      { id: 'urgent', label: 'Urgente', icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  ];

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
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={handleClose}
          ></div>
          
          <div className="relative w-full sm:w-96 bg-surface dark:bg-dark-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-slide-up">
            
            <div className="bg-primary p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                        <Bot size={20} />
                    </div>
                    <h3 className="font-bold text-lg tracking-wide">Oliv-IA</h3>
                </div>
                <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-500 animate-fade-in">
                        <CheckCircle size={48} className="mb-3" />
                        <p className="font-bold text-lg">¡Anotado!</p>
                        <p className="text-sm text-textSecondary text-center mt-1">Tarea guardada correctamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-textSecondary dark:text-dark-textSecondary mb-2 uppercase tracking-wider">
                                Tipo de Actividad
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {taskTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleTypeSelect(type.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-all border ${
                                            taskType === type.id 
                                            ? 'border-primary ring-1 ring-primary bg-primary/5' 
                                            : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-full mb-1 ${type.color}`}>
                                            <type.icon size={16} />
                                        </div>
                                        <span className={`text-[10px] font-medium ${taskType === type.id ? 'text-primary' : 'text-textSecondary'}`}>
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1.5">
                                {getInputLabel()}
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={getPlaceholder()}
                                    className={`w-full px-4 py-3 pr-10 bg-background dark:bg-dark-background border rounded-xl focus:ring-2 outline-none text-textPrimary dark:text-dark-textPrimary transition-all ${
                                        taskType === 'email' && note.length > 0 && !hasValidEmail(note)
                                        ? 'border-red-300 focus:ring-red-200'
                                        : 'border-border dark:border-dark-border focus:ring-primary'
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
                            
                            {/* Feedback Messages */}
                            {taskType === 'email' && (
                                <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${!note || hasValidEmail(note) ? 'text-textSecondary' : 'text-red-500 font-medium'}`}>
                                    <Mail size={10}/>
                                    {(!note || hasValidEmail(note)) 
                                        ? "El sistema buscará la dirección de email en el texto." 
                                        : "⚠️ Falta la dirección de correo (ej. hola@gmail.com)"}
                                </p>
                            )}
                            {taskType === 'meeting' && (
                                <p className="text-[10px] mt-1.5 text-textSecondary flex items-center gap-1">
                                    <Briefcase size={10}/>
                                    Escribe solo el nombre del cliente para crear el enlace.
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1.5">
                                ¿Cuándo es el evento? {taskType === 'email' ? '(Automático)' : '(Opcional)'}
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
                            disabled={!isFormValid || loading}
                            className="w-full py-3.5 bg-primary hover:bg-pink-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
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
