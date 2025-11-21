
import React, { useState } from 'react';
import { Plus, X, Bell, Calendar, CheckCircle, Loader2, Bot, Sparkles, Phone, Briefcase, AlertTriangle, Mail, FileText, Star } from 'lucide-react';
import { User } from '../types';
import { createTask } from '../services/supabaseClient';

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    setLoading(true);
    try {
        // Fix Timezone: Convert local input to ISO UTC string
        const isoDate = date ? new Date(date).toISOString() : undefined;

        // Prefix description based on type
        let finalDescription = note;
        switch (taskType) {
            case 'call': finalDescription = `📞 ${note}`; break;
            case 'meeting': finalDescription = `📅 ${note}`; break;
            case 'urgent': finalDescription = `⚠️ ${note}`; break;
            case 'email': finalDescription = `✉️ ${note}`; break;
            case 'note': finalDescription = `📝 ${note}`; break;
        }

        // Now saving to dedicated 'tasks' table with importance flag
        await createTask(user.id, finalDescription, isoDate, isImportant);

        setSuccess(true);
        setTimeout(() => {
            handleClose(); // Use handleClose to clean up
        }, 1500);

    } catch (error) {
        console.error("Error saving quick task:", error);
        alert("No se pudo guardar el recordatorio.");
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

  const openModal = () => {
      // Double ensure clean state on open
      setNote('');
      setDate('');
      setTaskType('note');
      setIsImportant(false);
      setSuccess(false);
      setIsOpen(true);
  };

  // Robust close handler to prevent "sticky" data
  const handleClose = () => {
      setIsOpen(false);
      // Small delay to clear state after animation starts/ends to avoid flicker
      setTimeout(() => {
          setNote('');
          setDate('');
          setTaskType('note');
          setIsImportant(false);
          setSuccess(false);
          setLoading(false);
      }, 300);
  };

  const taskTypes: { id: TaskType; label: string; icon: React.ElementType; color: string }[] = [
      { id: 'note', label: 'Nota', icon: FileText, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
      { id: 'call', label: 'Llamar', icon: Phone, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { id: 'meeting', label: 'Reunión', icon: Briefcase, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
      { id: 'email', label: 'Correo', icon: Mail, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
      { id: 'urgent', label: 'Urgente', icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  ];

  return (
    <>
      {/* Floating Button */}
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

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={handleClose}
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
                <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
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
                                        onClick={() => setTaskType(type.id)}
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
                                ¿Qué necesitas recordar?
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={taskType === 'call' ? 'Ej. Llamar a Juan Pérez...' : taskType === 'email' ? 'Ej. Enviar correo a...' : 'Escribe aquí...'}
                                    className="w-full px-4 py-3 pr-10 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-textPrimary dark:text-dark-textPrimary transition-all"
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
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1.5">
                                ¿Cuándo es el evento? (Opcional)
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
                            disabled={!note || loading}
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
