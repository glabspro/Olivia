
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Search, TrendingUp, FileText, Calendar, ArrowUpRight, DollarSign, Edit2, Copy, MoreVertical, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { getQuotations, updateQuotationStatus } from '../services/supabaseClient';
import { SavedQuotation, User } from '../types';

interface HistoryPageProps {
    user: User;
    onEditQuote?: (id: string) => void;
    onDuplicateQuote?: (id: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user, onEditQuote, onDuplicateQuote }) => {
    const [quotes, setQuotes] = useState<SavedQuotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
        
        try {
            await updateQuotationStatus(id, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            fetchData(); // Revert on error
        }
    };

    // Calculate Dashboard Metrics - REAL SALES (Accepted Only)
    // Projected = All except Rejected/Draft
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

    if (loading) {
         return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
         );
    }

    const MetricCard = ({ title, value, subValue, icon: Icon, colorClass, bgClass }: any) => (
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl border border-border dark:border-dark-border shadow-sm flex items-start justify-between">
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

    const StatusBadge = ({ status }: { status: string }) => {
        switch(status) {
            case 'draft': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><Clock size={10}/> Borrador</span>;
            case 'sent': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Send size={10}/> Enviada</span>;
            case 'accepted': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle size={10}/> Aprobada</span>;
            case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle size={10}/> Rechazada</span>;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Dashboard
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-coral rounded-full"></span>
                        </h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                            Resumen de actividad y métricas clave de tu negocio.
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <MetricCard 
                        title="Ventas Cerradas (Total)" 
                        value={`S/ ${totalSalesAmount.toFixed(2)}`} 
                        subValue={`${acceptedQuotes.length} aprobadas`}
                        icon={DollarSign} 
                        colorClass="text-green-500"
                        bgClass="bg-green-500/10"
                    />
                    <MetricCard 
                        title="Cotizaciones Totales" 
                        value={totalQuotesCount} 
                        subValue="Incluye borradores"
                        icon={FileText} 
                        colorClass="text-blue-500"
                        bgClass="bg-blue-500/10"
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

                {/* Recent Activity Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">Actividad Reciente</h3>
                    <div className="relative mt-2 md:mt-0 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Buscar cotización..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full md:w-64 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>

                {quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-sm border-dashed">
                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full mb-4">
                            <LayoutDashboard size={32} className="text-textSecondary" />
                        </div>
                        <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-textPrimary">Sin actividad reciente</h3>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2 text-center">
                            Genera tu primera cotización para ver las métricas.
                        </p>
                    </div>
                ) : (
                    <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm overflow-hidden min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-textSecondary dark:text-dark-textSecondary">
                                <thead className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-semibold">Nro.</th>
                                        <th scope="col" className="px-6 py-4 font-semibold">Cliente</th>
                                        <th scope="col" className="px-6 py-4 font-semibold">Fecha</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-right">Monto</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-center">Estado</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map((quote) => (
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
                                                {new Date(quote.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-textPrimary dark:text-dark-textPrimary">
                                                {quote.currency} {quote.total_amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="relative group inline-block">
                                                     <button className="focus:outline-none">
                                                        <StatusBadge status={quote.status} />
                                                     </button>
                                                     {/* Simple Status Dropdown on Hover/Click */}
                                                     <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                                                         {['draft', 'sent', 'accepted', 'rejected'].map(s => (
                                                             <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(quote.id, s)}
                                                                className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 capitalize ${quote.status === s ? 'font-bold' : ''}`}
                                                             >
                                                                 {s === 'draft' ? 'Borrador' : s === 'sent' ? 'Enviada' : s === 'accepted' ? 'Aprobada' : 'Rechazada'}
                                                             </button>
                                                         ))}
                                                     </div>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
