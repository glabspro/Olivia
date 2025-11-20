
import React, { useState, useEffect } from 'react';
import { User, SavedQuotation } from '../types';
import { getQuotations, deleteQuotation, updateQuotationStatus } from '../services/supabaseClient';
import { Search, FileText, Calendar, DollarSign, Edit, Copy, Trash2, Filter, ChevronDown, CheckCircle, XCircle, Send, FileEdit } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getQuotations(user.id);
        // FILTER OUT TASKS from the Sales Dashboard
        // We only want to show actual quotations here. Tasks are in TasksPage.
        const salesOnly = data.filter(q => !q.tags?.includes('task'));
        setQuotes(salesOnly);
    } catch (error) {
        console.error("Error loading history:", error);
    } finally {
        setLoading(false);
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
          case 'accepted': return 'Aceptada';
          case 'rejected': return 'Rechazada';
          case 'sent': return 'Enviada';
          case 'draft': return 'Borrador';
          case 'negotiation': return 'En Negociación';
          default: return status;
      }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                    Historial de Cotizaciones
                    <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-coral rounded-full"></span>
                </h2>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                    Gestiona y da seguimiento a tus propuestas comerciales.
                </p>
            </div>
             {/* Stats Summary (Simple) */}
             <div className="flex gap-4">
                <div className="bg-surface dark:bg-dark-surface px-4 py-2 rounded-lg border border-border dark:border-dark-border shadow-sm text-center">
                    <span className="block text-2xl font-bold text-primary">{quotes.length}</span>
                    <span className="text-xs text-textSecondary uppercase font-semibold">Total</span>
                </div>
                <div className="bg-surface dark:bg-dark-surface px-4 py-2 rounded-lg border border-border dark:border-dark-border shadow-sm text-center">
                    <span className="block text-2xl font-bold text-green-500">{quotes.filter(q => q.status === 'accepted').length}</span>
                    <span className="text-xs text-textSecondary uppercase font-semibold">Aceptadas</span>
                </div>
             </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-surface dark:bg-dark-surface p-4 rounded-xl border border-border dark:border-dark-border shadow-sm">
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
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <Filter size={18} className="text-textSecondary flex-shrink-0" />
                {['all', 'sent', 'accepted', 'draft', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                            statusFilter === status 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-background dark:bg-dark-background text-textSecondary hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                        {status === 'all' ? 'Todas' : getStatusLabel(status)}
                    </button>
                ))}
            </div>
        </div>

        {/* List */}
        <div className="space-y-4">
            {filteredQuotes.length === 0 ? (
                <div className="text-center py-16 bg-surface dark:bg-dark-surface rounded-xl border border-dashed border-border dark:border-dark-border">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium text-textPrimary dark:text-dark-textPrimary">No se encontraron cotizaciones</h3>
                    <p className="text-textSecondary dark:text-dark-textSecondary">Intenta cambiar los filtros de búsqueda.</p>
                </div>
            ) : (
                filteredQuotes.map(quote => (
                    <div key={quote.id} className="bg-surface dark:bg-dark-surface p-5 rounded-xl border border-border dark:border-dark-border shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono text-xs font-bold text-textSecondary bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                                        {quote.quotation_number}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${getStatusColor(quote.status)}`}>
                                        {getStatusLabel(quote.status)}
                                    </span>
                                    <span className="text-xs text-textSecondary flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(quote.created_at).toLocaleDateString('es-PE')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">{quote.client.name}</h3>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-textSecondary dark:text-dark-textSecondary">
                                    <span className="flex items-center gap-1">
                                        <DollarSign size={14} className="text-green-500"/>
                                        <span className="font-semibold text-textPrimary dark:text-dark-textPrimary">{quote.currency} {quote.total_amount.toFixed(2)}</span>
                                    </span>
                                    <span className="hidden sm:inline text-gray-300">|</span>
                                    <span className="line-clamp-1 max-w-xs">{quote.items?.length || 0} ítems</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                {/* Status Actions */}
                                <div className="relative group/status">
                                    <button className="px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors">
                                        Cambiar Estado <ChevronDown size={14}/>
                                    </button>
                                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-border dark:border-dark-border hidden group-hover/status:block z-20 overflow-hidden">
                                        {[
                                            { s: 'draft', l: 'Borrador', i: FileEdit, c: 'text-gray-500' },
                                            { s: 'sent', l: 'Enviada', i: Send, c: 'text-blue-500' },
                                            { s: 'accepted', l: 'Aceptada', i: CheckCircle, c: 'text-green-500' },
                                            { s: 'rejected', l: 'Rechazada', i: XCircle, c: 'text-red-500' }
                                        ].map(opt => (
                                            <button
                                                key={opt.s}
                                                onClick={() => handleStatusChange(quote.id, opt.s)}
                                                className={`w-full text-left px-4 py-3 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 ${opt.s === quote.status ? 'bg-gray-50 dark:bg-white/5' : ''}`}
                                            >
                                                <opt.i size={14} className={opt.c} />
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 border-l border-border dark:border-dark-border pl-3 ml-1">
                                    <button 
                                        onClick={() => onEditQuote(quote.id)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => onDuplicateQuote(quote.id)}
                                        className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" 
                                        title="Duplicar"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(quote.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default HistoryPage;
