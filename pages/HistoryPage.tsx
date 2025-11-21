
import React, { useState, useEffect } from 'react';
import { User, SavedQuotation } from '../types';
import { getQuotations, deleteQuotation, updateQuotationStatus, updateQuotationTags, updateQuotation } from '../services/supabaseClient';
import { Search, FileText, Calendar, DollarSign, Edit, Copy, Trash2, Filter, ChevronDown, CheckCircle, XCircle, Send, FileEdit, Tag, X, Phone, MessageCircle, Briefcase, AlertTriangle, Check, Save, Clock, BellRing, ClipboardList } from 'lucide-react';

// ... (Rest of imports remain same)

// --- Define CRM Tags ---
const CRM_TAGS = [
    { id: 'call', label: 'Llamar', icon: Phone, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', action: 'datetime', placeholder: '¿Cuándo llamar?' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500 bg-green-100 dark:bg-green-900/30', action: 'text', placeholder: 'Nota rápida...' },
    { id: 'meeting', label: 'Reunión', icon: Briefcase, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30', action: 'datetime', placeholder: 'Fecha de reunión' },
    { id: 'urgent', label: 'Urgente', icon: AlertTriangle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30', action: 'none' },
    { id: 'task', label: 'Tarea', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30', action: 'datetime', placeholder: 'Vencimiento de tarea' },
];

interface QuoteTagsProps {
    quote: SavedQuotation;
    onUpdateTags: (tags: string[], meta?: any) => void;
}

const QuoteTags: React.FC<QuoteTagsProps> = ({ quote, onUpdateTags }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [actionValue, setActionValue] = useState('');
    const [isEditingExisting, setIsEditingExisting] = useState(false);

    const handleOpenModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalOpen(true);
        setSelectedTagId(null);
        setActionValue('');
        setIsEditingExisting(false);
    };
    
    const handleTagClick = (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation();
        const tagDef = CRM_TAGS.find(t => t.id === tagId);
        
        // If tag has metadata (date/note), open modal to edit
        if (tagDef && tagDef.action !== 'none') {
             setIsModalOpen(true);
             setSelectedTagId(tagId);
             setIsEditingExisting(true);
             
             // Load existing value
             if (tagDef.action === 'datetime') {
                 setActionValue(quote.crm_meta?.next_followup || '');
             } else if (tagDef.action === 'text') {
                 setActionValue(quote.crm_meta?.notes || '');
             }
        } else {
            setIsModalOpen(true);
            setSelectedTagId(tagId);
            setIsEditingExisting(true);
        }
    };

    const handleSaveTag = () => {
        if (!selectedTagId) return;
        
        try {
            const currentTags = quote.tags || [];
            const newTags = isEditingExisting ? currentTags : [...new Set([...currentTags, selectedTagId])]; 
            
            const tagDef = CRM_TAGS.find(t => t.id === selectedTagId);
            let newMeta = { ...quote.crm_meta };

            if (tagDef?.action === 'datetime') {
                 if (!actionValue) {
                     alert("Por favor selecciona una fecha.");
                     return;
                 }
                 newMeta.next_followup = actionValue;
                 newMeta.reminder_sent = false;
            } else if (tagDef?.action === 'text') {
                 newMeta.notes = actionValue;
            }
            
            onUpdateTags(newTags, newMeta);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving tag:", error);
            alert("Error al guardar. Verifica tu conexión.");
        }
    };
    
    const handleRemoveTag = () => {
         if (!selectedTagId) return;
         const newTags = (quote.tags || []).filter(t => t !== selectedTagId);
         
         let newMeta = { ...quote.crm_meta };
         const tagDef = CRM_TAGS.find(t => t.id === selectedTagId);
         if (tagDef?.action === 'datetime') delete newMeta.next_followup;
         if (tagDef?.action === 'text') delete newMeta.notes;

         onUpdateTags(newTags, newMeta);
         setIsModalOpen(false);
    };

    const selectedTagDef = CRM_TAGS.find(t => t.id === selectedTagId);
    
    let reminderNotice = null;
    if (selectedTagDef?.action === 'datetime' && actionValue) {
        const eventDate = new Date(actionValue);
        const now = new Date();
        
        if (eventDate < now) {
            reminderNotice = <span className="text-gray-500 text-xs mt-2 block bg-gray-100 dark:bg-white/10 p-2 rounded">📅 Fecha pasada. Se guardará como historial (sin recordatorio).</span>;
        } else {
            const isTask = selectedTagId === 'task';
            const minutesBefore = isTask ? 30 : 120; 
            const reminderTime = new Date(eventDate.getTime() - minutesBefore * 60000);
            
            if (reminderTime < now) {
                 reminderNotice = <span className="text-amber-600 text-xs mt-2 block bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100">⚠️ Evento próximo. El recordatorio se enviará en la siguiente ronda (aprox. 10 min).</span>;
            } else {
                const timeStr = reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const dayStr = reminderTime.toLocaleDateString([], {day: 'numeric', month: 'short'});
                reminderNotice = <span className="text-blue-600 dark:text-blue-400 text-xs mt-2 block bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100">🔔 Te enviaré un WhatsApp el <b>{dayStr}</b> a las <b>{timeStr}</b> ({isTask ? '30 min' : '2h'} antes).</span>;
            }
        }
    }


    return (
        <div className="flex flex-wrap gap-2 mt-2" onClick={e => e.stopPropagation()}>
            {(quote.tags || []).map(tagId => {
                const tag = CRM_TAGS.find(t => t.id === tagId);
                if (!tag) return null;
                const Icon = tag.icon;
                const isNotified = quote.crm_meta?.reminder_sent === true && (tag.action === 'datetime');
                
                return (
                    <button 
                        key={tagId} 
                        onClick={(e) => handleTagClick(e, tagId)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-transparent hover:border-current transition-all ${tag.color}`}
                        title={isNotified ? "Recordatorio enviado" : "Click para editar"}
                    >
                        <Icon size={12} />
                        {tag.label}
                        {isNotified && <BellRing size={10} className="text-green-600 ml-1" />}
                    </button>
                );
            })}
            
            <button 
                onClick={handleOpenModal}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
                <Tag size={12} /> Etiqueta
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm border border-border dark:border-dark-border overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-textPrimary dark:text-dark-textPrimary text-sm">
                                {selectedTagId ? 'Editar Etiqueta' : 'Agregar Etiqueta'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={16} className="text-textSecondary"/></button>
                        </div>
                        
                        <div className="p-4">
                            {!selectedTagId ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {CRM_TAGS.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => setSelectedTagId(tag.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all ${tag.color.replace('text-', 'hover:bg-opacity-80 ')} bg-opacity-10`}
                                        >
                                            <tag.icon size={24} className="mb-1"/>
                                            <span className="text-xs font-bold">{tag.label}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`flex items-center gap-2 p-2 rounded-lg ${selectedTagDef?.color}`}>
                                        {selectedTagDef && <selectedTagDef.icon size={18} />}
                                        <span className="font-bold text-sm">{selectedTagDef?.label}</span>
                                    </div>

                                    {selectedTagDef?.action === 'datetime' && (
                                        <div>
                                            <label className="text-xs text-textSecondary mb-1 block">{selectedTagDef.placeholder || 'Fecha y Hora'}</label>
                                            <input 
                                                type="datetime-local" 
                                                value={actionValue}
                                                onChange={e => setActionValue(e.target.value)}
                                                className="w-full p-2 rounded border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm text-textPrimary dark:text-dark-textPrimary"
                                            />
                                            {reminderNotice}
                                        </div>
                                    )}

                                    {selectedTagDef?.action === 'text' && (
                                        <div>
                                            <label className="text-xs text-textSecondary mb-1 block">{selectedTagDef.placeholder || 'Nota'}</label>
                                            <textarea 
                                                rows={3}
                                                value={actionValue}
                                                onChange={e => setActionValue(e.target.value)}
                                                className="w-full p-2 rounded border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm text-textPrimary dark:text-dark-textPrimary"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        {isEditingExisting && (
                                            <button 
                                                onClick={handleRemoveTag}
                                                className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 transition-colors"
                                                title="Eliminar etiqueta"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleSaveTag}
                                            disabled={selectedTagDef?.action !== 'none' && !actionValue}
                                            className="flex-1 bg-primary text-white py-2 rounded font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface HistoryPageProps {
  user: User;
  onEditQuote: (id: string) => void;
  onDuplicateQuote: (id: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user, onEditQuote, onDuplicateQuote }) => {
  const [quotes, setQuotes] = useState<SavedQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getQuotations(user.id);
        const salesOnly = data.filter(q => !q.tags?.includes('task'));
        setQuotes(salesOnly);
    } catch (error) {
        console.error("Error loading history:", error);
    } finally {
        setLoading(false);
    }
  };
  
  const handleUpdateTags = async (quoteId: string, newTags: string[], meta?: any) => {
      try {
          setQuotes(quotes.map(q => q.id === quoteId ? { ...q, tags: newTags, crm_meta: meta } : q));
          await updateQuotationTags(quoteId, newTags, meta);
      } catch (error) {
          console.error("Error updating tags:", error);
      }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta cotización?')) {
      try {
        await deleteQuotation(id);
        setQuotes(quotes.filter(q => q.id !== id));
      } catch (error) {
        console.error("Error deleting quotation:", error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
      try {
          await updateQuotationStatus(id, newStatus);
          setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus as any } : q));
      } catch (error) {
          console.error("Error updating status:", error);
      }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
        quote.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
          case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
          case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
          case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
          case 'negotiation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
          default: return 'bg-gray-100 text-gray-800';
      }
  };
  
  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'accepted': return 'Ganada';
          case 'rejected': return 'Perdida';
          case 'sent': return 'Enviada';
          case 'draft': return 'Borrador';
          case 'negotiation': return 'Negociación';
          default: return status;
      }
  };
  
  const KANBAN_COLUMNS = [
      { id: 'draft', title: 'Borrador', color: 'border-gray-300' },
      { id: 'sent', title: 'Enviada', color: 'border-blue-400' },
      { id: 'negotiation', title: 'En Negociación', color: 'border-yellow-400' },
      { id: 'accepted', title: 'Ganada', color: 'border-green-500' },
      { id: 'rejected', title: 'Perdida', color: 'border-red-400' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData("quoteId", id);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
      const quoteId = e.dataTransfer.getData("quoteId");
      if (quoteId) {
          const quote = quotes.find(q => q.id === quoteId);
          if (quote && quote.status !== newStatus) {
              await handleStatusChange(quoteId, newStatus);
          }
      }
  };

  const totalSales = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total_amount, 0);
  const currentMonth = new Date().getMonth();
  const quotesThisMonth = quotes.filter(q => new Date(q.created_at).getMonth() === currentMonth).length;


  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full flex flex-col pb-24">
        {/* Header & Metrics */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                    Dashboard de Ventas
                    <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-coral rounded-full"></span>
                </h2>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                    Tu centro de control comercial.
                </p>
            </div>
             
             <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <button 
                    onClick={() => {
                        setViewMode('list');
                        document.getElementById('quote-list-container')?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="bg-surface dark:bg-dark-surface px-4 py-3 rounded-xl border border-border dark:border-dark-border shadow-sm text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                    <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wider">Ventas Reales</span>
                    <span className="block text-xl font-bold text-green-500 mt-1">S/ {totalSales.toFixed(0)}</span>
                </button>
                <button 
                    onClick={() => {
                        setViewMode('list');
                        document.getElementById('quote-list-container')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm text-center hover:scale-105 transition-transform cursor-pointer"
                >
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 uppercase font-bold tracking-wider">Cotizaciones</span>
                    <span className="block text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{quotes.length}</span>
                </button>
                 <div className="bg-surface dark:bg-dark-surface px-4 py-3 rounded-xl border border-border dark:border-dark-border shadow-sm text-center">
                    <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wider">Este Mes</span>
                    <span className="block text-xl font-bold text-purple-500 mt-1">{quotesThisMonth}</span>
                </div>
             </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-surface dark:bg-dark-surface p-2 md:p-4 rounded-xl border border-border dark:border-dark-border shadow-sm sticky top-16 md:top-0 z-10">
            <div className="relative flex-grow">
                <input 
                    type="text" 
                    placeholder="Buscar por cliente o número..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex bg-background dark:bg-dark-background p-1 rounded-lg border border-border dark:border-dark-border">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow text-primary' : 'text-textSecondary'}`}
                        title="Vista Lista"
                    >
                        <Filter size={18} />
                    </button>
                     <button 
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-white/10 shadow text-primary' : 'text-textSecondary'}`}
                        title="Vista Tablero"
                    >
                        <FileText size={18} className="rotate-90" />
                    </button>
                </div>
                
                {viewMode === 'list' && (
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                        {['all', 'sent', 'accepted', 'draft'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                                    statusFilter === status 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-gray-100 dark:bg-white/5 text-textSecondary hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                            >
                                {status === 'all' ? 'Todas' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div id="quote-list-container" className="flex-grow">
            {filteredQuotes.length === 0 ? (
                <div className="text-center py-16 bg-surface dark:bg-dark-surface rounded-xl border border-dashed border-border dark:border-dark-border">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium text-textPrimary dark:text-dark-textPrimary">No hay cotizaciones</h3>
                    <p className="text-textSecondary dark:text-dark-textSecondary">Comienza creando una nueva.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="space-y-4">
                    {/* Optimized Mobile Cards View */}
                     <div className="md:hidden space-y-4">
                        {filteredQuotes.map(quote => (
                            <div key={quote.id} className="bg-surface dark:bg-dark-surface p-5 rounded-xl border border-border dark:border-dark-border shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-50"></div>
                                
                                <div className="flex justify-between items-start mb-3 pl-3">
                                     <div>
                                        <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary leading-tight">{quote.client.name}</h3>
                                        <p className="text-xs text-textSecondary mt-1">{new Date(quote.created_at).toLocaleDateString()}</p>
                                     </div>
                                     <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${getStatusColor(quote.status)}`}>
                                        {getStatusLabel(quote.status)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-end pl-3 mb-4">
                                    <div>
                                        <p className="text-xs text-textSecondary font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded inline-block mb-1">{quote.quotation_number}</p>
                                    </div>
                                    <span className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">{quote.currency} {quote.total_amount.toFixed(2)}</span>
                                </div>
                                
                                <div className="pl-3 mb-4 border-t border-border dark:border-dark-border pt-3">
                                    <QuoteTags quote={quote} onUpdateTags={(tags, meta) => handleUpdateTags(quote.id, tags, meta)} />
                                </div>

                                <div className="grid grid-cols-3 gap-3 pl-3">
                                    <button 
                                        onClick={() => onEditQuote(quote.id)}
                                        className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                                    >
                                        <Edit size={18}/> Editar
                                    </button>
                                    <button 
                                        onClick={() => onDuplicateQuote(quote.id)} 
                                        className="py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                                    >
                                        <Copy size={18}/> Copiar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(quote.id)} 
                                        className="py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                                    >
                                        <Trash2 size={18}/> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                     </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border overflow-hidden">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-textSecondary uppercase font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Cotización</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Etiquetas (CRM)</th>
                                    <th className="px-6 py-4 text-right">Monto</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-dark-border">
                                {filteredQuotes.map(quote => (
                                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold">{quote.quotation_number}</span>
                                            <div className="text-xs text-textSecondary mt-1">{new Date(quote.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{quote.client.name}</td>
                                        <td className="px-6 py-4">
                                             <div className="relative group/status">
                                                <button className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${getStatusColor(quote.status)}`}>
                                                    {getStatusLabel(quote.status)} <ChevronDown size={12}/>
                                                </button>
                                                <div className="hidden group-focus-within:block group-hover/status:block absolute left-0 mt-1 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-border dark:border-dark-border z-50">
                                                     {['draft', 'sent', 'negotiation', 'accepted', 'rejected'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(quote.id, s)}
                                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg"
                                                        >
                                                            {getStatusLabel(s)}
                                                        </button>
                                                     ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <QuoteTags quote={quote} onUpdateTags={(tags, meta) => handleUpdateTags(quote.id, tags, meta)} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {quote.currency} {quote.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => onEditQuote(quote.id)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded transition-colors"><Edit size={16}/></button>
                                                <button onClick={() => onDuplicateQuote(quote.id)} className="p-1.5 hover:bg-purple-50 text-purple-500 rounded transition-colors"><Copy size={16}/></button>
                                                <button onClick={() => handleDelete(quote.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
            ) : (
                /* KANBAN VIEW */
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
                    {KANBAN_COLUMNS.map(col => {
                        const colQuotes = filteredQuotes.filter(q => q.status === col.id);
                        return (
                            <div 
                                key={col.id} 
                                className="flex-shrink-0 w-72 md:w-80 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col border-t-4"
                                style={{borderColor: col.color.replace('border-', 'var(--tw-border-opacity, 1) ')}}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className={`p-3 border-b border-gray-200 dark:border-white/10 flex justify-between items-center ${col.color.replace('border', 'border-t')}`}>
                                    <h3 className="font-bold text-sm text-textPrimary dark:text-dark-textPrimary uppercase">{col.title}</h3>
                                    <span className="bg-white dark:bg-white/10 px-2 py-0.5 rounded text-xs font-bold">{colQuotes.length}</span>
                                </div>
                                
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {colQuotes.map(quote => (
                                        <div 
                                            key={quote.id}
                                            draggable="true"
                                            className="bg-surface dark:bg-dark-surface p-3 rounded-lg shadow-sm border border-border dark:border-dark-border cursor-default group relative hover:ring-2 ring-primary/50 transition-all"
                                        >
                                            <div 
                                                className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
                                                draggable="true"
                                                onDragStart={(e) => handleDragStart(e, quote.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                            </div>

                                            <div className="pr-6">
                                                <h4 className="font-bold text-sm text-textPrimary dark:text-dark-textPrimary line-clamp-1">{quote.client.name}</h4>
                                                <p className="text-xs text-textSecondary mb-2">{quote.quotation_number}</p>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold">{quote.currency} {quote.total_amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-3 pt-2 border-t border-border dark:border-dark-border">
                                                <QuoteTags quote={quote} onUpdateTags={(tags, meta) => handleUpdateTags(quote.id, tags, meta)} />
                                            </div>

                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-surface dark:bg-dark-surface p-1 rounded shadow-sm">
                                                <button onClick={() => onEditQuote(quote.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                                                <button onClick={() => handleDelete(quote.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
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
