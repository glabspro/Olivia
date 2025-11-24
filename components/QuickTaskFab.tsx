
import React, { useState, useRef } from 'react';
import { 
    Plus, X, Calendar, CheckCircle, Loader2, Bot, Sparkles, 
    Phone, Briefcase, AlertTriangle, Mail, FileText, 
    Paperclip, ArrowLeft, ChevronRight, User, ExternalLink, AtSign, Smartphone
} from 'lucide-react';
import { User as UserType } from '../types';
import { createTask, triggerTaskAutomation, uploadGenericFile } from '../services/supabaseClient';

interface QuickTaskFabProps {
  user: UserType;
}

type TaskType = 'note' | 'call' | 'meeting' | 'urgent' | 'email';
type ViewState = 'menu' | 'form';

const countries = [
  { code: 'PE', name: 'Perú', dial_code: '+51', flag: '🇵🇪' },
  { code: 'MX', name: 'México', dial_code: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dial_code: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dial_code: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', dial_code: '+54', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', dial_code: '+591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'EC', name: 'Ecuador', dial_code: '+593', flag: '🇪🇨' },
  { code: 'PY', name: 'Paraguay', dial_code: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dial_code: '+598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', dial_code: '+58', flag: '🇻🇪' },
  { code: 'PA', name: 'Panamá', dial_code: '+507', flag: '🇵🇦' },
  { code: 'DO', name: 'R. Dominicana', dial_code: '+1', flag: '🇩🇴' },
];

const QuickTaskFab: React.FC<QuickTaskFabProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewState>('menu');
  const [taskType, setTaskType] = useState<TaskType>('note');
  
  // Form States
  const [note, setNote] = useState(''); // Body / Description
  const [recipient, setRecipient] = useState(''); // Client Name
  const [recipientPhone, setRecipientPhone] = useState(''); // Client Phone (New for Meetings)
  const [countryCode, setCountryCode] = useState('+51'); // Default Country Code
  const [recipientEmail, setRecipientEmail] = useState(''); // Client Email
  const [subject, setSubject] = useState(''); // Email Subject
  const [attachment, setAttachment] = useState<File | null>(null);
  const [date, setDate] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  
  // Feedback States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Configuration Checks ---
  const hasCalLink = !!user.settings?.calComLink;
  const calLink = user.settings?.calComLink || '';
  
  // --- Helpers ---
  const hasValidEmail = (text: string) => /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/.test(text);

  const handleOpen = () => {
      resetForm();
      setIsOpen(true);
      setView('menu');
  };

  const handleClose = () => {
      setIsOpen(false);
      setTimeout(() => resetForm(), 300);
  };

  const resetForm = () => {
      setNote('');
      setRecipient('');
      setRecipientPhone('');
      setCountryCode('+51');
      setRecipientEmail('');
      setSubject('');
      setAttachment(null);
      setDate('');
      setIsImportant(false);
      setSuccess(false);
      setLoading(false);
      setActionMessage('');
      setView('menu');
  };

  const selectOption = (type: TaskType) => {
      setTaskType(type);
      setView('form');
  };

  const goBack = () => {
      setView('menu');
      setSuccess(false);
  };

  // --- Logic ---

  const isFormValid = () => {
      if (taskType === 'email') return recipientEmail.length > 0 && hasValidEmail(recipientEmail) && note.length > 0 && subject.length > 0;
      if (taskType === 'meeting') return recipient.length > 0 && recipientPhone.length > 0 && hasCalLink; // Require Phone for meetings
      return note.length > 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
        let finalDescription = '';
        let finalDate = date ? new Date(date).toISOString() : undefined;
        let isImmediateAction = false;
        let successMsg = 'Guardado';

        // Sanitize inputs to prevent breaking the pipe parser in n8n
        const sanitize = (str: string) => str.replace(/\|/g, ' ').trim();

        const cleanNote = sanitize(note);
        const cleanRecipient = sanitize(recipient);
        const cleanEmail = recipientEmail.trim().toLowerCase();
        
        // Construct Full Phone Number with Country Code
        const rawPhone = recipientPhone.replace(/\D/g, '');
        const cleanCode = countryCode.replace('+', '');
        let fullPhone = rawPhone;
        
        // Only prepend code if the user hasn't typed it already (basic check)
        if (!rawPhone.startsWith(cleanCode)) {
            fullPhone = `${cleanCode}${rawPhone}`;
        }

        switch (taskType) {
            case 'call': 
                finalDescription = `CALL: ${cleanNote} (${cleanRecipient || 'Cliente'})`; 
                successMsg = 'Llamada Registrada';
                break;
                
            case 'meeting': 
                // Formato actualizado para n8n: MEET: Nombre | Teléfono | Email
                // Nota: cleanEmail también se enviará explícitamente en el objeto payload
                finalDescription = `MEET: ${cleanRecipient} | ${fullPhone} | ${cleanEmail}`; 
                isImmediateAction = true;
                successMsg = 'Invitación Enviada!';
                if (!finalDate) finalDate = new Date().toISOString();
                break;
                
            case 'email': 
                let attachmentUrl = '';
                if (attachment) {
                    try {
                        attachmentUrl = await uploadGenericFile(attachment);
                    } catch (error) {
                        console.error("Upload failed", error);
                    }
                }
                const fullBody = `Asunto: ${subject}\n\n${cleanNote}${attachmentUrl ? `\n\n📎 Archivo Adjunto: ${attachmentUrl}` : ''}`;
                finalDescription = `SEND: ${cleanEmail} | ${fullBody}`; 
                isImmediateAction = true;
                successMsg = 'Correo Enviado';
                if (!finalDate) finalDate = new Date(Date.now() + 2 * 60000).toISOString();
                break;
                
            case 'urgent': 
                finalDescription = `⚠️ ${cleanNote}`; 
                successMsg = 'Urgencia Anotada';
                setIsImportant(true);
                break;
                
            case 'note': 
                finalDescription = `📝 ${cleanNote}`; 
                successMsg = 'Tarea Guardada';
                break;
        }

        // 1. Trigger Automation (n8n) - ALWAYS for immediate actions or urgent
        if (isImmediateAction || taskType === 'urgent') {
             await triggerTaskAutomation(user, {
                type: taskType,
                description: finalDescription,
                date: finalDate || new Date().toISOString(),
                email: cleanEmail // Explicitly pass email for robust handling
            });
        }

        // 2. Save to Database - CONDICIONADO
        // Solo guardamos en la base de datos si NO es una acción inmediata (Reunión/Email)
        // Las reuniones y correos son "efímeros" (solo disparo), las llamadas y tareas son "historial".
        if (taskType !== 'meeting' && taskType !== 'email') {
            await createTask(user.id, finalDescription, finalDate, isImportant);
        }
        
        // 3. Success UI
        setActionMessage(successMsg);
        setSuccess(true);
        setTimeout(() => handleClose(), 2000);

    } catch (error) {
        console.error("Error saving task:", error);
        alert("Hubo un problema al procesar la acción.");
        setLoading(false);
    }
  };

  // --- UI Components ---

  const MenuCard = ({ id, icon: Icon, title, desc, colorClass, bgClass }: any) => (
      <button 
        onClick={() => selectOption(id)}
        className="flex flex-col items-start text-left p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg transition-all bg-white dark:bg-white/5 group relative overflow-hidden"
      >
          <div className={`p-3 rounded-lg mb-3 ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
              <Icon size={24} />
          </div>
          <h4 className="font-bold text-textPrimary dark:text-dark-textPrimary text-sm">{title}</h4>
          <p className="text-xs text-textSecondary dark:text-dark-textSecondary mt-1 leading-snug">{desc}</p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
              <ChevronRight size={16} />
          </div>
      </button>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        className={`fixed bottom-[5.5rem] md:bottom-8 right-4 md:right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bg-gradient-to-r from-primary to-pink-600 text-white hover:scale-105 hover:shadow-pink-500/25`}
        title="Asistente Oliv-IA"
      >
        <div className="relative">
            <Bot size={28} />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold shadow-sm hidden md:block">
            Asistente Oliv-IA
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={handleClose}
          ></div>
          
          <div className="relative w-full sm:w-[450px] bg-surface dark:bg-dark-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-slide-up transition-all duration-300 flex flex-col max-h-[80dvh] sm:max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 pt-6 sm:pt-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    {view === 'form' ? (
                        <button onClick={goBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <div className="p-1.5 bg-white/10 rounded-full border border-white/20">
                            <Bot size={20} className="text-pink-400"/>
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-base leading-none">
                            {view === 'menu' ? '¿En qué te ayudo hoy?' : 
                             taskType === 'email' ? 'Redactar Correo' :
                             taskType === 'meeting' ? 'Agendar Reunión' :
                             taskType === 'call' ? 'Registrar Llamada' :
                             taskType === 'urgent' ? 'Tarea Prioritaria' : 'Nueva Tarea'}
                        </h3>
                    </div>
                </div>
                <button onClick={handleClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-grow bg-gray-50 dark:bg-black/20 pb-safe-offset-4">
                
                {success ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">{actionMessage}</h3>
                        <p className="text-textSecondary mt-2">Tu asistente se encargará del resto.</p>
                    </div>
                ) : view === 'menu' ? (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in pb-4">
                        <div className="col-span-2 mb-2">
                            <p className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">Comunicaciones</p>
                            <div className="grid grid-cols-2 gap-3">
                                <MenuCard 
                                    id="meeting" 
                                    icon={Calendar} 
                                    title="Reunión" 
                                    desc="Envía invitaciones o agenda tú mismo." 
                                    colorClass="text-purple-600" 
                                    bgClass="bg-purple-100 dark:bg-purple-900/30" 
                                />
                                <MenuCard 
                                    id="email" 
                                    icon={Mail} 
                                    title="Correo" 
                                    desc="Redacta correos con adjuntos PDF." 
                                    colorClass="text-orange-600" 
                                    bgClass="bg-orange-100 dark:bg-orange-900/30" 
                                />
                            </div>
                        </div>
                        
                        <div className="col-span-2">
                            <p className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">Gestión Interna</p>
                            <div className="grid grid-cols-2 gap-3">
                                <MenuCard 
                                    id="call" 
                                    icon={Phone} 
                                    title="Reg. Llamada" 
                                    desc="Bitácora de llamadas a clientes." 
                                    colorClass="text-blue-600" 
                                    bgClass="bg-blue-100 dark:bg-blue-900/30" 
                                />
                                <MenuCard 
                                    id="note" 
                                    icon={FileText} 
                                    title="Tarea" 
                                    desc="Guarda ideas o pendientes." 
                                    colorClass="text-gray-600" 
                                    bgClass="bg-gray-100 dark:bg-gray-800" 
                                />
                            </div>
                        </div>

                         <div className="col-span-2 mt-2">
                             <button 
                                onClick={() => selectOption('urgent')}
                                className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500">
                                    <AlertTriangle size={20}/>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Tarea Prioritaria</h4>
                                    <p className="text-xs text-red-600/80 dark:text-red-400/70">Marcar como urgente.</p>
                                </div>
                             </button>
                         </div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 animate-fade-in pb-4">
                        
                        {/* --- MEETING FORM --- */}
                        {taskType === 'meeting' && (
                            <div className="space-y-4">
                                {!hasCalLink ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 text-center">
                                        <AlertTriangle size={32} className="mx-auto text-red-500 mb-2"/>
                                        <h4 className="font-bold text-red-700 dark:text-red-400">Falta Configuración</h4>
                                        <p className="text-xs text-red-600 dark:text-red-300 mb-3">Necesitas agregar tu enlace de Cal.com en ajustes para usar esta función.</p>
                                        <button type="button" onClick={handleClose} className="text-xs font-bold underline text-red-700">Ir a Ajustes</button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Nombre del Cliente</label>
                                            <div className="relative">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={recipient}
                                                    onChange={e => setRecipient(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                                    placeholder="Ej. Juan Pérez"
                                                />
                                                <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-textSecondary uppercase mb-1">WhatsApp del Cliente</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    className="w-24 pl-2 pr-1 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm appearance-none cursor-pointer"
                                                >
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.dial_code}>{c.flag} {c.dial_code}</option>
                                                    ))}
                                                </select>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="tel" 
                                                        value={recipientPhone}
                                                        onChange={e => setRecipientPhone(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                                        placeholder="Ej. 987654321"
                                                    />
                                                    <Smartphone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Email (Opcional)</label>
                                            <div className="relative">
                                                <input 
                                                    type="email" 
                                                    value={recipientEmail}
                                                    onChange={e => setRecipientEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                                    placeholder="Para pre-llenar la agenda"
                                                />
                                                <AtSign className="absolute left-3 top-3 text-gray-400" size={18}/>
                                            </div>
                                        </div>

                                        {/* Dual Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if(!recipient) return;
                                                    // Open Cal.com with pre-filled name and email
                                                    let link = calLink;
                                                    if (!link.startsWith('http')) link = `https://${link}`;
                                                    
                                                    let url = `${link}?name=${encodeURIComponent(recipient)}`;
                                                    if (recipientEmail) url += `&email=${encodeURIComponent(recipientEmail)}`;
                                                    
                                                    window.open(url, '_blank');
                                                    handleClose();
                                                }}
                                                disabled={!recipient}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50"
                                            >
                                                <ExternalLink size={20} className="mb-1"/>
                                                <span className="text-xs font-bold">Agendar Yo</span>
                                                <span className="text-[9px] opacity-70">Abrir Calendario</span>
                                            </button>

                                            <button 
                                                type="submit" 
                                                disabled={!recipient || !recipientPhone || loading}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20} className="mb-1"/>}
                                                <span className="text-xs font-bold">Enviar Invitación</span>
                                                <span className="text-[9px] opacity-90">Por WhatsApp</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- EMAIL FORM --- */}
                        {taskType === 'email' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Para (Email)</label>
                                    <div className="relative">
                                        <input 
                                            autoFocus
                                            type="email" 
                                            value={recipientEmail}
                                            onChange={e => setRecipientEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            placeholder="cliente@empresa.com"
                                        />
                                        <AtSign className="absolute left-3 top-3 text-gray-400" size={18}/>
                                    </div>
                                    {recipientEmail && !hasValidEmail(recipientEmail) && <p className="text-[10px] text-red-500 mt-1">* Email inválido</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Asunto</label>
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        placeholder="Ej. Propuesta Económica"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Mensaje</label>
                                    <textarea 
                                        rows={4} 
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none"
                                        placeholder="Escribe tu mensaje aquí..."
                                    />
                                </div>
                                <div>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setAttachment(e.target.files[0])}/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors">
                                        <Paperclip size={14}/> {attachment ? attachment.name : 'Adjuntar Archivo (Opcional)'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- CALL FORM --- */}
                        {taskType === 'call' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">¿Con quién hablaste?</label>
                                    <div className="relative">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={recipient}
                                            onChange={e => setRecipient(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="Nombre del Cliente"
                                        />
                                        <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Resumen de la llamada</label>
                                    <textarea 
                                        rows={3}
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                        placeholder="Ej. Quedamos en enviar cotización mañana..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- STANDARD NOTE / URGENT --- */}
                        {(taskType === 'note' || taskType === 'urgent') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">
                                        {taskType === 'urgent' ? 'Detalle de Urgencia' : 'Nota'}
                                    </label>
                                    <textarea 
                                        autoFocus
                                        rows={4}
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className={`w-full px-4 py-3 bg-white dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 outline-none text-sm resize-none ${taskType === 'urgent' ? 'focus:ring-red-500' : 'focus:ring-gray-500'}`}
                                        placeholder={taskType === 'urgent' ? 'Ej. Pagar servicios hoy...' : 'Ej. Comprar insumos...'}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button (Only for non-meeting types or Email) */}
                        {taskType !== 'meeting' && (
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={!isFormValid() || loading}
                                    className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 text-white ${
                                        taskType === 'email' ? 'bg-orange-600 hover:bg-orange-700' :
                                        taskType === 'call' ? 'bg-blue-600 hover:bg-blue-700' :
                                        taskType === 'urgent' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-gray-800 hover:bg-black'
                                    }`}
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                        <>
                                            {taskType === 'email' ? 'Enviar Correo' :
                                            taskType === 'call' ? 'Registrar' :
                                            'Guardar'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                    </form>
                )}
            </div>
            
            {/* Footer */}
            <div className="bg-surface dark:bg-dark-surface p-2 text-center border-t border-border dark:border-dark-border hidden sm:block">
                <p className="text-[10px] text-textSecondary opacity-60">Power by Olivia AI</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickTaskFab;