
import React, { useState, useEffect } from 'react';
import { User, DbTask } from '../types';
import { getTasks, deleteTask, updateTaskCompletion, updateTaskImportance, updateTask } from '../services/supabaseClient';
import { ClipboardList, CheckCircle2, Trash2, Clock, Calendar, RefreshCw, BellRing, Phone, Briefcase, AlertTriangle, Mail, FileText, Star, X, Edit2, Save, ArrowRight, Sun, Timer, Check } from 'lucide-react';

interface TasksPageProps {
    user: User;
}

const TasksPage: React.FC<TasksPageProps> = ({ user }) => {
    const [tasks, setTasks] = useState<DbTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Edit Form State
    const [editDescription, setEditDescription] = useState('');
    const [editDate, setEditDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [user.id]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await getTasks(user.id);
            setTasks(data);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await updateTaskCompletion(id, true);
            setTasks(tasks.filter(t => t.id !== id));
            if (selectedTask?.id === id) setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error completing task:", error);
        }
    };

    const handleToggleImportant = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            // Optimistic update
            setTasks(tasks.map(t => t.id === id ? { ...t, is_important: !currentStatus } : t));
            await updateTaskImportance(id, !currentStatus);
        } catch (error) {
            console.error("Error updating importance:", error);
            fetchTasks(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar esta tarea permanentemente?')) {
            try {
                await deleteTask(id);
                setTasks(tasks.filter(t => t.id !== id));
                if (selectedTask?.id === id) setIsEditModalOpen(false);
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const openEditModal = (task: DbTask) => {
        setSelectedTask(task);
        setEditDescription(task.description);
        
        if (task.due_date) {
            const d = new Date(task.due_date);
            const offsetMs = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
            setEditDate(localISOTime);
        } else {
            setEditDate('');
        }
        setIsEditModalOpen(true);
    };

    // --- QUICK ACTIONS HELPERS ---
    const updateDate = (addDays: number, addHours: number, setNineAm: boolean = false) => {
        const d = new Date();
        d.setDate(d.getDate() + addDays);
        d.setHours(d.getHours() + addHours);
        
        if (setNineAm) {
            d.setHours(9, 0, 0, 0);
        }

        const offsetMs = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
        setEditDate(localISOTime);
    };

    const setDatePlusOneHour = () => updateDate(0, 1);
    const setDateTomorrow = () => updateDate(1, 0, true);
    
    const setDateNextWeek = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7; 
        d.setDate(diff);
        d.setHours(9, 0, 0, 0);
        
        const offsetMs = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
        setEditDate(localISOTime);
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        
        setIsSaving(true);
        try {
            const finalDate = editDate ? new Date(editDate).toISOString() : undefined;
            await updateTask(selectedTask.id, editDescription, finalDate);
            
            // Update local state
            setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, description: editDescription, due_date: finalDate, reminder_sent: false } : t));
            
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating task", error);
            alert("Error al guardar cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    // Group Tasks
    const now = new Date();
    const activeTasks = tasks.filter(t => !t.is_completed);
    
    const overdue = activeTasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const upcoming = activeTasks.filter(t => !t.due_date || new Date(t.due_date) >= now);

    const sortTasks = (taskList: DbTask[]) => {
        return [...taskList].sort((a, b) => {
            if (a.is_important !== b.is_important) return a.is_important ? -1 : 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        return `Hace ${minutes} min`;
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400">
                            <ClipboardList size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Tareas y Recordatorios</h2>
                            <p className="text-textSecondary dark:text-dark-textSecondary text-sm">Gestiona tus pendientes personales.</p>
                        </div>
                    </div>
                    <button onClick={fetchTasks} className="p-2 text-textSecondary hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                        <RefreshCw size={20} />
                    </button>
                </div>

                {activeTasks.length === 0 ? (
                    <div className="text-center py-12 bg-surface dark:bg-dark-surface rounded-xl border border-dashed border-border dark:border-dark-border">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-textPrimary dark:text-dark-textPrimary">¡Todo al día!</h3>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-1">No tienes tareas pendientes.</p>
                        <p className="text-xs text-textSecondary mt-4">Usa el botón <strong>Oliv-IA</strong> abajo a la derecha para crear una nueva.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {overdue.length > 0 && (
                            <section className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <AlertTriangle size={16}/> Vencidos ({overdue.length})
                                </h3>
                                <div className="space-y-3">
                                    {sortTasks(overdue).map(task => (
                                        <div key={task.id} className="bg-white dark:bg-dark-surface p-3 rounded-lg shadow-sm border border-red-200 dark:border-red-900/50 flex items-center justify-between gap-3 group hover:shadow-md transition-all">
                                            <div className="flex-grow min-w-0 cursor-pointer" onClick={() => openEditModal(task)}>
                                                <p className="font-medium text-textPrimary dark:text-dark-textPrimary truncate">
                                                    {task.description.replace(/^(📞|📅|⚠️|✉️|📝|CALL:|MEET:|SEND:|URGENT:|NOTE:)\s*/, '')}
                                                </p>
                                                <p className="text-xs text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                                                    <Clock size={10}/> Venció: {getRelativeTime(task.due_date!)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button 
                                                    onClick={() => handleComplete(task.id)}
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-bold flex items-center gap-1"
                                                    title="Marcar como realizado"
                                                >
                                                    <Check size={14}/> Hecho
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {upcoming.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Calendar size={16}/> Próximos / Sin Fecha
                                </h3>
                                <div className="space-y-3">
                                    {sortTasks(upcoming).map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task} 
                                            onClick={() => openEditModal(task)}
                                            onComplete={handleComplete} 
                                            onToggleImportant={handleToggleImportant} 
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* EDIT / DETAILS MODAL */}
            {isEditModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-surface dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-2xl border border-border dark:border-dark-border animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                                <Edit2 size={18} className="text-primary"/>
                                Editar Tarea
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-textSecondary hover:text-textPrimary"/></button>
                        </div>
                        
                        <form onSubmit={handleSaveChanges} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Detalle / Anotación</label>
                                    <textarea 
                                        rows={4} 
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        className="w-full p-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Fecha y Hora de Vencimiento</label>
                                    <input 
                                        type="datetime-local" 
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        className="w-full p-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm text-textPrimary dark:text-dark-textPrimary"
                                    />
                                    
                                    {/* Quick Action Buttons */}
                                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                                        <button type="button" onClick={setDatePlusOneHour} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap flex items-center gap-1">
                                            <Timer size={14}/> +1 Hora
                                        </button>
                                        <button type="button" onClick={setDateTomorrow} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap flex items-center gap-1">
                                            <Sun size={14}/> Mañana 9am
                                        </button>
                                        <button type="button" onClick={setDateNextWeek} className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap flex items-center gap-1">
                                            <Calendar size={14}/> Próx. Semana
                                        </button>
                                        <button type="button" onClick={() => setEditDate('')} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                                            Sin Fecha
                                        </button>
                                    </div>
                                    
                                    <p className="text-[10px] text-textSecondary mt-2">Te avisaremos 30 minutos antes de esta hora.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3">
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Guardando...' : <><Save size={18}/> Guardar Cambios</>}
                                </button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => handleComplete(selectedTask.id)}
                                        className="py-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-bold rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={18}/> Realizado
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleDelete(selectedTask.id)}
                                        className="py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18}/> Eliminar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskCard: React.FC<{ 
    task: DbTask, 
    onClick: () => void,
    onComplete: (id: string) => void, 
    onToggleImportant: (id: string, current: boolean, e: React.MouseEvent) => void,
    isOverdue?: boolean 
}> = ({ task, onClick, onComplete, onToggleImportant, isOverdue }) => {
    const date = task.due_date ? new Date(task.due_date) : null;

    // Determine type from prefix
    const getTaskType = (desc: string) => {
        if (desc.startsWith('📞') || desc.startsWith('CALL:')) return { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        if (desc.startsWith('📅') || desc.startsWith('MEET:')) return { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        if (desc.startsWith('⚠️') || desc.startsWith('URGENT:')) return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
        if (desc.startsWith('✉️') || desc.startsWith('SEND:')) return { icon: Mail, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        if (desc.startsWith('📝') || desc.startsWith('NOTE:')) return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' };
        return { icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' };
    };

    const cleanDescription = task.description.replace(/^(📞|📅|⚠️|✉️|📝|CALL:|MEET:|SEND:|URGENT:|NOTE:)\s*/, '');
    const typeStyle = getTaskType(task.description);
    const TypeIcon = typeStyle.icon;

    const formatDate = (d: Date) => {
        const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    };

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer group ${
            task.is_important 
            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400 border-y-yellow-200 border-r-yellow-200 dark:border-y-yellow-900/30 dark:border-r-yellow-900/30' 
            : isOverdue 
                ? 'bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                : 'bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:border-primary/30'
        }`}>
            <div className="flex-grow min-w-0 flex items-start gap-3">
                 <div className={`p-2 rounded-lg flex-shrink-0 ${typeStyle.bg} ${typeStyle.color}`}>
                    <TypeIcon size={18} />
                 </div>
                 <div className="min-w-0">
                    <div className="flex items-start gap-2">
                        <p className={`font-medium text-sm md:text-base truncate ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-textPrimary dark:text-dark-textPrimary'}`}>
                            {cleanDescription}
                        </p>
                        {task.reminder_sent && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 mt-0.5" title="Recordatorio enviado">
                                <BellRing size={10} />
                            </span>
                        )}
                    </div>
                    {date && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-textSecondary dark:text-dark-textSecondary'}`}>
                            <Clock size={12} />
                            {formatDate(date)}
                        </p>
                    )}
                 </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={(e) => onToggleImportant(task.id, !!task.is_important, e)}
                    className={`p-2 rounded-lg transition-colors ${task.is_important ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                    <Star size={20} fill={task.is_important ? "currentColor" : "none"} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
                    className="p-2 text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-lg transition-colors"
                >
                    <CheckCircle2 size={20} />
                </button>
            </div>
        </div>
    );
}

export default TasksPage;
