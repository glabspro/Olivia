
import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { getQuotations } from '../services/supabaseClient';
import { SavedQuotation, User } from '../types';

interface HistoryPageProps {
    user: User;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user }) => {
    const [quotes, setQuotes] = useState<SavedQuotation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getQuotations(user.id);
                setQuotes(data);
            } catch (error) {
                console.error("Error loading history:", error);
            }
            setLoading(false);
        };

        fetchData();
    }, [user.id]);

    if (loading) {
         return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
         );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Historial de Cotizaciones
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-coral rounded-full"></span>
                        </h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                            Consulta y gestiona las cotizaciones generadas anteriormente.
                        </p>
                    </div>
                    {/* Placeholder for Search */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente..." 
                            className="pl-10 pr-4 py-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>

                {quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-sm">
                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full mb-4">
                            <History size={32} className="text-accent-coral" />
                        </div>
                        <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-textPrimary">Aún no hay cotizaciones</h3>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2 text-center">
                            Las cotizaciones que generes aparecerán aquí automáticamente.
                        </p>
                    </div>
                ) : (
                    <div className="bg-surface dark:bg-dark-surface rounded-lg border border-border dark:border-dark-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-textSecondary dark:text-dark-textSecondary">
                                <thead className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-semibold">Nro.</th>
                                        <th scope="col" className="px-6 py-4 font-semibold">Cliente</th>
                                        <th scope="col" className="px-6 py-4 font-semibold">Fecha</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-right">Total</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map((quote) => (
                                        <tr key={quote.id} className="border-b border-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-textPrimary dark:text-dark-textPrimary">
                                                {quote.quotation_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-textPrimary dark:text-dark-textPrimary">{quote.client.name}</span>
                                                    <span className="text-xs">{quote.client.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(quote.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-textPrimary dark:text-dark-textPrimary">
                                                {quote.currency} {quote.total_amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    quote.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    quote.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {quote.status === 'sent' ? 'Enviada' : quote.status}
                                                </span>
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
