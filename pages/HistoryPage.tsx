
import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Search, TrendingUp, FileText, Calendar, ArrowUpRight, DollarSign, Edit2, Copy, MoreVertical, CheckCircle, XCircle, Clock, Send, Tag, List, Kanban, Handshake, Phone, MessageCircle, Briefcase, AlertTriangle, MoreHorizontal, GripVertical, Plus, Save, X, Trash2, ClipboardList, Bell } from 'lucide-react';
import { getQuotations, updateQuotationStatus, updateQuotationTags } from '../services/supabaseClient';
import { SavedQuotation, User, CrmMeta } from '../types';

interface HistoryPageProps {
    user: User;
    onEditQuote?: (id: string) => void;
    onDuplicateQuote?: (id: string) => void;
}

const CRM_TAGS = [
    { id: 'call', label: 'Llamar', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Phone, actionType: 'datetime' },
    { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-100 text-green-700 border-green-200', icon: MessageCircle, actionType: 'text' },
    { id: 'meeting', label: 'Reunión', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Briefcase, actionType: 'datetime' },
    { id: 'task', label: 'Tarea', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: ClipboardList, actionType: 'datetime' },
    { id: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, actionType: 'none' },
];

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    'draft': { label: 'Borrador', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
    'sent': { label: 'Enviada', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Send },
    'negotiation': { label: 'Negociación', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Handshake },
    'accepted': { label: 'Ganada', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    'rejected': { label: 'Perdida', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

const MetricCard = ({ title, value, subValue, icon: Icon, colorClass, bgClass, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-surface dark:bg-dark-surface p-6 rounded-xl border border-border dark:border-dark-border shadow-sm flex items-start justify-between transition-transform active:scale-95 ${onClick ? 'cursor-pointer hover:shadow-md ring-2 ring-transparent hover:ring-primary/20' : ''}`}
    >
        <div>
            <p className="text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">{value}</h3>
            {subValue && <p className="text-xs text-green-500 flex items-center mt-1"><ArrowUpRight size={12} className="mr-1"/> {subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>
            <Icon size={24} className={colorClass} />
        </div>
    </div>
);

const TagBadge: React.FC<{ tagId: string }> = ({ tagId }) => {
    const tagDef = CRM_TAGS.find(t => t.id === tagId);
    if (!tagDef) return null;
    const Icon = tagDef.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${tagDef.color} cursor-pointer hover:opacity-80`}>
            <Icon size={8}/> {tagDef.label}
        </span>
    );
};

// --- Reusable Tags Component ---
const QuoteTags: React.FC<{ 
    quote: SavedQuotation, 
    onManageTags: (quote: SavedQuotation) => void,
    onTagClick: (quote: SavedQuotation, tagId: string) => void
}> = ({ quote, onManageTags, onTagClick }) => {
    return (
        <div className="flex flex-wrap gap-1 items-center relative z-10">
            {quote.tags?.map(tagId => (
                <div key={tagId} onClick={(e) => { e.stopPropagation(); onTagClick(quote, tagId); }}>
                    <TagBadge tagId={tagId} />
                </div>
            ))}
            
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onManageTags(quote); 
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                title="Agregar Etiqueta"
            >
                <Tag size={12} />
            </button>
        </div>
    );
};

const HistoryPage: React.FC<HistoryPageProps> = ({ user, onEditQuote, onDuplicateQuote }) => {
    const [quotes, setQuotes] = useState<SavedQuotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [draggedQuoteId, setDraggedQuoteId] = useState<string | null>(null);
    
    // Tag Management State
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    
    const [activeQuote, setActiveQuote] = useState<SavedQuotation | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [tagInputValue, setTagInputValue] = useState('');

    // Status Dropdown State (Desktop)
    const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);

    const quotesListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            const data = await getQuotations(user.id);
            setQuotes(data);
        } catch (error) {
            console.error("Error loading history:", error);
        }
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus as any } : q));
        setActiveStatusDropdown(null); // Close dropdown on selection
        
        try {
            await updateQuotationStatus(id, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            fetchData(); // Revert on error
        }
    };
    
    // Step 1: Open Selection Modal (Add New)
    const openTagManager = (quote: SavedQuotation) => {
        setActiveQuote(quote);
        setShowSelectionModal(true);
    };
    
    // Step 1.5: Click Existing Tag (Edit/View)
    const handleExistingTagClick = (quote: SavedQuotation, tagId: string) => {
        setActiveQuote(quote);
        setSelectedTagId(tagId);
        
        // Pre-fill data based on meta
        const meta = quote.crm_meta || {};
        const tagDef = CRM_TAGS.find(t => t.id === tagId);
        
        if (tagDef?.actionType === 'datetime') {
            setTagInputValue(meta.next_followup || '');
        } else if (tagDef?.actionType === 'text') {
            setTagInputValue(meta.notes || '');
        } else {
            setTagInputValue('');
        }
        
        setShowActionModal(true);
    };

    // Step 2: Select Tag from List (New)
    const handleTagSelect = (tagId: string) => {
        if (!activeQuote) return;
        
        // If tag exists, just close selection (user should click the tag itself to edit/remove)
        // OR we can toggle it off here. Let's just open the Action Modal to allow editing/removing.
        setSelectedTagId(tagId);
        
        const currentTags = activeQuote.tags || [];
        if (currentTags.includes(tagId)) {
            // Already exists, populate data for editing
            const meta = activeQuote.crm_meta || {};
             const tagDef = CRM_TAGS.find(t => t.id === tagId);
            if (tagDef?.actionType === 'datetime') setTagInputValue(meta.next_followup || '');
            else if (tagDef?.actionType === 'text') setTagInputValue(meta.notes || '');
        } else {
            // New tag, clean input
            setTagInputValue('');
        }
        
        setShowSelectionModal(false);
        setShowActionModal(true);
    };
    
    // Step 3: Confirm Action (Save Date/Note)
    const confirmTagAction = async () => {
        if (!activeQuote || !selectedTagId) return;
        
        const currentMeta = activeQuote.crm_meta || {};
        let newMeta: CrmMeta = { ...currentMeta };
        
        if (selectedTagId === 'call' || selectedTagId === 'meeting' || selectedTagId === 'task') {
            newMeta.next_followup = tagInputValue;
            // Remove reminder_sent flag if date changes to allow new notification
            if (newMeta.next_followup !== currentMeta.next_followup) {
                 delete (newMeta as any).reminder_sent;
            }
        } else if (selectedTagId === 'whatsapp') {
            newMeta.notes = tagInputValue;
        }

        const currentTags = activeQuote.tags || [];
        // Add tag if not present
        const newTags = currentTags.includes(selectedTagId) ? currentTags : [...currentTags, selectedTagId];
        
        // Update local state
        setQuotes(quotes.map(q => q.id === activeQuote.id ? { ...q, tags: newTags, crm_meta: newMeta } : q));
        closeModals();
        
        try {
            await updateQuotationTags(activeQuote.id, newTags, newMeta);
        } catch (error) {
            console.error("Failed to update tags with meta", error);
            fetchData();
        }
    }

    const removeTag = async () => {
        if (!activeQuote || !selectedTagId) return;
        
        const currentTags = activeQuote.tags || [];
        const newTags = currentTags.filter(t => t !== selectedTagId);
        
        // Update local state
        setQuotes(quotes.map(q => q.id === activeQuote.id ? { ...q, tags: newTags } : q));
        closeModals();
        
        try {
            await updateQuotationTags(activeQuote.id, newTags, activeQuote.crm_meta); // Keep meta or clear specific fields? Keep for now
        } catch (error) {
            console.error("Failed to remove tag", error);
            fetchData();
        }
    };

    const closeModals = () => {
        setShowActionModal(false);
        setShowSelectionModal(false);
        setActiveQuote(null);
        setSelectedTagId(null);
        setTagInputValue('');
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, quoteId: string) => {
        setDraggedQuoteId(quoteId);
        e.dataTransfer.effectAllowed = 'move';
        const cardElement = (e.target as HTMLElement).closest('.kanban-card');
        if (cardElement) {
            e.dataTransfer.setDragImage(cardElement, 20, 20);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (draggedQuoteId) {
            handleStatusChange(draggedQuoteId, newStatus);
            setDraggedQuoteId(null);
        }
    };


    // Calculate Dashboard Metrics - REAL SALES (Accepted Only)
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
    const totalSalesAmount = acceptedQuotes.reduce((sum, quote) => sum + Number(quote.total_amount), 0);
    const totalQuotesCount = quotes.length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthAccepted = acceptedQuotes.filter(q => {
        const d = new Date(q.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisMonthSalesAmount = thisMonthAccepted.reduce((sum, quote) => sum + Number(quote.total_amount), 0);


    const filteredQuotes = quotes.filter(q => 
        q.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    const scrollToQuotes = () => {
        setViewMode('list');
        setTimeout(() => {
            if (quotesListRef.current) {
                quotesListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Helper to safely get tag definition
    const getTagDef = (id: string) => CRM_TAGS.find(t => t.id === id);

    const KanbanCard: React.FC<{ quote: SavedQuotation }> = ({ quote }) => (
        <div 
            className="kanban-card bg-white dark:bg-dark-surface p-4 rounded-lg shadow-sm border border-border dark:border-dark-border mb-3 group relative transition-shadow hover:shadow-md"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-textSecondary dark:text-dark-textSecondary bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{quote.quotation_number}</span>
                <div 
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-400 hover:text-primary"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, quote.id)}
                    title="Arrastrar para mover"
                >
                     <GripVertical size={16}/>
                </div>
            </div>
            
            <h4 className="font-bold text-textPrimary dark:text-dark-textPrimary truncate mb-1">{quote.client.name}</h4>
            <p className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary mb-3">{quote.currency} {quote.total_amount.toFixed(2)}</p>
            
            {/* CRM Meta Info Display */}
            {quote.crm_meta?.next_followup && quote.tags?.some(t => t === 'call' || t === 'meeting' || t === 'task') && (
                <div className="mb-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded flex items-center gap-1">
                    <Calendar size={10}/>
                    {formatDate(quote.crm_meta.next_followup)}
                </div>
            )}
             {quote.crm_meta?.notes && quote.tags?.includes('whatsapp') && (
                <div className="mb-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1 truncate">
                    <MessageCircle size={10}/>
                    {quote.crm_meta.notes}
                </div>
            )}

            {/* Tags Component */}
            <div className="mb-3">
                <QuoteTags quote={quote} onManageTags={openTagManager} onTagClick={handleExistingTagClick} />
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-[10px] text-textSecondary dark:text-dark-textSecondary">{new Date(quote.created_at).toLocaleDateString('es-PE')}</span>
                
                <div className="flex gap-1">
                    <button onClick={() => onEditQuote?.(quote.id)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar"><Edit2 size={12}/></button>
                    <button onClick={() => onDuplicateQuote?.(quote.id)} className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors" title="Duplicar"><Copy size={12}/></button>
                </div>
            </div>
        </div>
    );
    
    const MobileListCard: React.FC<{ quote: SavedQuotation }> = ({ quote }) => {
        const statusInfo = STATUS_CONFIG[quote.status] || STATUS_CONFIG['sent'];
        const StatusIcon = statusInfo.icon;
        return (
            <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-border dark:border-dark-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-bold text-textPrimary dark:text-dark-textPrimary">{quote.client.name}</h4>
                        <p className="text-xs text-textSecondary dark:text-dark-textSecondary">{quote.quotation_number} • {new Date(quote.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                        <StatusIcon size={10}/> {statusInfo.label}
                    </span>
                </div>
                
                <div className="flex justify-between items-end mt-3">
                     <div>
                        <p className="text-xs text-textSecondary dark:text-dark-textSecondary mb-1">Total:</p>
                        <p className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">{quote.currency} {quote.total_amount.toFixed(2)}</p>
                     </div>
                     <div className="flex gap-2">
                         <button onClick={() => onEditQuote?.(quote.id)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg" title="Editar"><Edit2 size={18}/></button>
                         <button onClick={() => onDuplicateQuote?.(quote.id)} className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg" title="Duplicar"><Copy size={18}/></button>
                     </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                     <QuoteTags quote={quote} onManageTags={openTagManager} onTagClick={handleExistingTagClick} />
                     
                     <select 
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                        className="text-xs bg-transparent border-none focus:ring-0 text-textSecondary dark:text-dark-textSecondary text-right pr-0 cursor-pointer"
                     >
                         {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                             <option key={k} value={k}>{v.label}</option>
                         ))}
                     </select>
                </div>
            </div>
        );
    }

    if (loading) {
         return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
         );
    }

    const selectedTagDef = selectedTagId ? getTagDef(selectedTagId) : null;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full flex flex-col">
            {/* MODAL 1: Selection (List of Tags) */}
            {showSelectionModal && activeQuote && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface dark:bg-dark-surface rounded-xl w-full max-w-xs shadow-2xl border border-border dark:border-dark-border overflow-hidden">
                         <div className="p-4 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                             <h3 className="font-bold text-textPrimary dark:text-dark-textPrimary">Etiquetar Cotización</h3>
                             <button onClick={closeModals}><X size={18} className="text-textSecondary"/></button>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                            {CRM_TAGS.map(tag => {
                                const isSelected = activeQuote.tags?.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagSelect(tag.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                    >
                                        <div className={`p-2 rounded-full ${tag.color.split(' ')[0].replace('bg-', 'bg-opacity-20 bg-')} ${tag.color.split(' ')[1]}`}>
                                            <tag.icon size={16} />
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-textPrimary dark:text-dark-textPrimary'}`}>
                                            {tag.label}
                                        </span>
                                        {isSelected && <CheckCircle size={16} className="ml-auto text-primary"/>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Actions (Date/Note/Delete) */}
            {showActionModal && activeQuote && selectedTagDef && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface dark:bg-dark-surface rounded-xl w-full max-w-sm shadow-2xl border border-border dark:border-dark-border">
                        <div className="p-4 border-b border-border dark:border-dark-border flex justify-between items-center">
                             <h3 className="font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                                <selectedTagDef.icon size={18} />
                                {selectedTagDef.label}
                             </h3>
                             <button onClick={closeModals}><X size={18} className="text-textSecondary"/></button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary mb-3">
                                {selectedTagDef.actionType === 'datetime' ? '¿Cuándo programas esta acción?' : 'Añade una nota rápida:'}
                            </p>
                            
                            {selectedTagDef.id === 'whatsapp' ? (
                                <input 
                                    type="text" 
                                    value={tagInputValue}
                                    onChange={(e) => setTagInputValue(e.target.value)}
                                    placeholder="Ej. Catálogo enviado..."
                                    className="w-full p-2 border rounded bg-background dark:bg-dark-background border-border dark:border-dark-border text-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <input 
                                        type="datetime-local"
                                        value={tagInputValue}
                                        onChange={(e) => setTagInputValue(e.target.value)}
                                        className="w-full p-2 border rounded bg-background dark:bg-dark-background border-border dark:border-dark-border text-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <div className="mt-3 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-600 dark:text-blue-400">
                                        <Bell size={14} className="mt-0.5 flex-shrink-0"/>
                                        <p>Te enviaremos un <strong>WhatsApp 20 min antes</strong>.</p>
                                    </div>
                                </>
                            )}
                            
                            <div className="flex gap-2 mt-4">
                                {activeQuote.tags?.includes(selectedTagDef.id) && (
                                    <button 
                                        onClick={removeTag}
                                        className="flex items-center justify-center px-3 py-2 text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        title="Eliminar Etiqueta"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={confirmTagAction}
                                    disabled={!tagInputValue && selectedTagDef.id !== 'urgent'}
                                    className="flex-grow py-2 bg-primary text-white font-bold rounded-lg shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex-shrink-0 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Dashboard
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-coral rounded-full"></span>
                        </h2>
                    </div>
                    <div className="flex items-center bg-surface dark:bg-dark-surface p-1 rounded-lg border border-border dark:border-dark-border shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-white/10 text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                        >
                            <List size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 dark:bg-white/10 text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                        >
                            <Kanban size={20} />
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <MetricCard 
                        title="Ventas Ganadas" 
                        value={`S/ ${totalSalesAmount.toFixed(2)}`} 
                        subValue={`${acceptedQuotes.length} aprobadas`}
                        icon={DollarSign} 
                        colorClass="text-green-500"
                        bgClass="bg-green-500/10"
                    />
                    <MetricCard 
                        title="Cotizaciones Totales" 
                        value={totalQuotesCount} 
                        subValue="Ver listado completo"
                        icon={FileText} 
                        colorClass="text-blue-500"
                        bgClass="bg-blue-500/10"
                        onClick={scrollToQuotes}
                    />
                    <MetricCard 
                        title="Ventas este Mes" 
                        value={`S/ ${thisMonthSalesAmount.toFixed(2)}`} 
                        subValue={`${thisMonthAccepted.length} ventas`}
                        icon={Calendar} 
                        colorClass="text-purple-500"
                        bgClass="bg-purple-500/10"
                    />
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 mb-4">
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente o número..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary shadow-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
            </div>

            {/* Content Area */}
            <div id="quotes-list-view" ref={quotesListRef} className="flex-grow flex flex-col md:h-[calc(100vh-350px)] md:overflow-hidden">
                {quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-sm border-dashed">
                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full mb-4">
                            <LayoutDashboard size={32} className="text-textSecondary" />
                        </div>
                        <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-textPrimary">Sin actividad reciente</h3>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2 text-center">
                            Genera tu primera cotización para ver el tablero.
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    <>
                        {/* Mobile List View - Natural height */}
                        <div className="md:hidden space-y-3 pb-24">
                            {filteredQuotes.map(quote => (
                                <MobileListCard key={quote.id} quote={quote} />
                            ))}
                        </div>

                        {/* Desktop List View - Constrained height with scroll */}
                        <div className="hidden md:block bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm overflow-hidden h-full overflow-y-auto">
                            <table className="w-full text-sm text-left text-textSecondary dark:text-dark-textSecondary">
                                <thead className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase bg-gray-50 dark:bg-white/5 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Nro.</th>
                                        <th className="px-6 py-4 font-semibold">Cliente</th>
                                        <th className="px-6 py-4 font-semibold">Etiquetas</th>
                                        <th className="px-6 py-4 font-semibold text-right">Monto</th>
                                        <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                        <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map((quote) => {
                                        const statusInfo = STATUS_CONFIG[quote.status] || STATUS_CONFIG['sent'];
                                        const StatusIcon = statusInfo.icon;
                                        const isDropdownOpen = activeStatusDropdown === quote.id;

                                        return (
                                            <tr key={quote.id} className="border-b border-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-textPrimary dark:text-dark-textPrimary">
                                                    {quote.quotation_number}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-textPrimary dark:text-dark-textPrimary">{quote.client.name}</span>
                                                        <span className="text-xs opacity-75">{quote.client.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <QuoteTags quote={quote} onManageTags={openTagManager} onTagClick={handleExistingTagClick} />
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-textPrimary dark:text-dark-textPrimary">
                                                    {quote.currency} {quote.total_amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="relative inline-block">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveStatusDropdown(isDropdownOpen ? null : quote.id);
                                                            }}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${statusInfo.color} shadow-sm hover:brightness-95 active:scale-95`}
                                                        >
                                                            <StatusIcon size={12}/> {statusInfo.label}
                                                        </button>
                                                        
                                                        {isDropdownOpen && (
                                                            <>
                                                                <div 
                                                                    className="fixed inset-0 z-40 cursor-default" 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveStatusDropdown(null);
                                                                    }}
                                                                ></div>
                                                                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animate-fade-in">
                                                                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                                                        <button
                                                                            key={key}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleStatusChange(quote.id, key);
                                                                            }}
                                                                            className={`flex items-center gap-2 w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${quote.status === key ? 'font-bold text-primary' : 'text-textPrimary dark:text-dark-textPrimary'}`}
                                                                        >
                                                                            <val.icon size={14} className={quote.status === key ? 'text-primary' : 'text-gray-400'}/>
                                                                            {val.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => onEditQuote && onEditQuote(quote.id)}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => onDuplicateQuote && onDuplicateQuote(quote.id)}
                                                            className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                                                            title="Duplicar"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full gap-4 overflow-x-auto pb-4">
                        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
                            const columnQuotes = filteredQuotes.filter(q => q.status === statusKey);
                            
                            return (
                                <div 
                                    key={statusKey}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, statusKey)}
                                    className="flex-shrink-0 w-72 bg-gray-50 dark:bg-white/5 rounded-xl border border-border dark:border-dark-border flex flex-col h-full max-h-full"
                                >
                                    {/* Column Header */}
                                    <div className={`p-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl flex justify-between items-center ${config.color.split(' ')[0].replace('bg-', 'bg-opacity-20 bg-')}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm text-textPrimary dark:text-dark-textPrimary">
                                            <config.icon size={16}/>
                                            {config.label}
                                        </div>
                                        <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">{columnQuotes.length}</span>
                                    </div>
                                    
                                    {/* Cards Container */}
                                    <div className="p-2 flex-grow overflow-y-auto">
                                        {columnQuotes.length === 0 ? (
                                             <div className="h-20 flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg m-1">
                                                 Vacío
                                             </div>
                                        ) : (
                                            columnQuotes.map(quote => (
                                                <KanbanCard key={quote.id} quote={quote} />
                                            ))
                                        )}
                                    </div>
                                    
                                    {/* Column Footer Total */}
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-right">
                                        <span className="text-xs text-gray-500 font-medium">Total: </span>
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                             S/ {columnQuotes.reduce((sum, q) => sum + Number(q.total_amount), 0).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
