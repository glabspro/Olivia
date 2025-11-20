
import React, { useState, useEffect } from 'react';
import { User, DbTask } from '../types';
import { getTasks, deleteTask, updateTaskCompletion } from '../services/supabaseClient';
import { ClipboardList, CheckCircle2, Trash2, Clock, Calendar, RefreshCw, BellRing, Phone, Briefcase, AlertTriangle, Mail, FileText } from 'lucide-react';

interface TasksPageProps {
    user: User;
}

const TasksPage: React.FC<TasksPageProps> = ({ user }) => {
    const [tasks, setTasks] = useState<DbTask[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error("Error completing task:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar esta tarea permanentemente?')) {
            try {
                await deleteTask(id);
                setTasks(tasks.filter(t => t.id !== id));
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    // Group Tasks
    const now = new Date();
    const activeTasks = tasks.filter(t => !t.is_completed);
    
    const overdue = activeTasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const upcoming = activeTasks.filter(t => !t.due_date || new Date(t.due_date) >= now);

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
                            <section>
                                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Clock size={16}/> Vencidos
                                </h3>
                                <div className="space-y-3">
                                    {overdue.map(task => (
                                        <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} isOverdue />
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
                                    {upcoming.map(task => (
                                        <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskCard: React.FC<{ task: DbTask, onComplete: (id: string) => void, onDelete: (id: string) => void, isOverdue?: boolean }> = ({ task, onComplete, onDelete, isOverdue }) => {
    const date = task.due_date ? new Date(task.due_date) : null;

    // Determine type from prefix
    const getTaskType = (desc: string) => {
        if (desc.startsWith('📞')) return { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        if (desc.startsWith('📅')) return { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        if (desc.startsWith('⚠️')) return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
        if (desc.startsWith('✉️')) return { icon: Mail, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        if (desc.startsWith('📝')) return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' };
        return { icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' };
    };

    const cleanDescription = task.description.replace(/^(📞|📅|⚠️|✉️|📝)\s*/, '');
    const typeStyle = getTaskType(task.description);
    const TypeIcon = typeStyle.icon;

    return (
        <div className={`bg-surface dark:bg-dark-surface p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10' : 'border-border dark:border-dark-border'}`}>
            <div className="flex-grow min-w-0 flex items-start gap-3">
                 <div className={`p-2 rounded-lg flex-shrink-0 ${typeStyle.bg} ${typeStyle.color}`}>
                    <TypeIcon size={18} />
                 </div>
                 <div className="min-w-0">
                    <div className="flex items-start gap-2">
                        <p className={`font-medium text-base truncate ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-textPrimary dark:text-dark-textPrimary'}`}>
                            {cleanDescription}
                        </p>
                        {task.reminder_sent && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 mt-0.5" title="Recordatorio enviado por WhatsApp">
                                <BellRing size={10} />
                            </span>
                        )}
                    </div>
                    {date && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-textSecondary dark:text-dark-textSecondary'}`}>
                            <Clock size={12} />
                            {date.toLocaleString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                 </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                    onClick={() => onComplete(task.id)}
                    className="p-2 text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                    title="Completar"
                >
                    <CheckCircle2 size={20} />
                </button>
                <button 
                    onClick={() => onDelete(task.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title="Eliminar"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}

export default TasksPage;
