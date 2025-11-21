
import React, { useState, useEffect } from 'react';
import { DbClient, User, SavedQuotation } from '../types';
import { getClients, saveClient, deleteClient, getClientQuotations } from '../services/supabaseClient';
import { Users, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, X, FileText, ArrowLeft, Calendar, DollarSign, Briefcase, History } from 'lucide-react';

interface ClientsPageProps {
    user: User;
}

// --- Component: Client Detail View (CRM Profile) ---
const ClientDetailView = ({ client, onClose, onEdit }: { client: DbClient, onClose: () => void, onEdit: (c: DbClient) => void }) => {
    const [history, setHistory] = useState<SavedQuotation[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const data = await getClientQuotations(client.id);
                setHistory(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
    }, [client.id]);

    const totalSales = history.filter(h => h.status === 'accepted').reduce((sum, h) => sum + h.total_amount, 0);
    const lastContact = history.length > 0 ? new Date(history[0].created_at).toLocaleDateString() : 'Sin contacto reciente';

    return (
        <div className="animate-fade-in">
            <button onClick={onClose} className="flex items-center gap-2 text-textSecondary hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={20} /> Volver a la lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-10"></div>
                        <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 shadow-md border-4 border-white dark:border-gray-700 mb-4">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">{client.name}</h2>
                            <p className="text-sm text-textSecondary">{client.email || 'Sin correo'}</p>
                            
                            <div className="mt-6 flex justify-center gap-3">
                                <button onClick={() => onEdit(client)} className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
                                    <Edit2 size={16}/> Editar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-4">Información de Contacto</h3>
                        <div className="flex items-center gap-3 text-sm text-textPrimary dark:text-dark-textPrimary">
                            <Phone size={18} className="text-gray-400"/> 
                            <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-textPrimary dark:text-dark-textPrimary">
                            <FileText size={18} className="text-gray-400"/> 
                            <span>{client.document || 'Sin documento'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-textPrimary dark:text-dark-textPrimary">
                            <MapPin size={18} className="text-gray-400"/> 
                            <span>{client.address || 'Sin dirección'}</span>
                        </div>
                    </div>
                    
                    <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm p-6">
                        <h3 className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-4">Resumen Comercial</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-textSecondary">Ventas Totales</span>
                                <span className="font-bold text-green-600">S/ {totalSales.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-textSecondary">Cotizaciones</span>
                                <span className="font-bold text-textPrimary dark:text-dark-textPrimary">{history.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-textSecondary">Último Contacto</span>
                                <span className="text-sm font-medium text-textPrimary dark:text-dark-textPrimary">{lastContact}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History / Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-sm h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-border dark:border-dark-border flex items-center gap-2">
                            <History className="text-primary" size={20} />
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary">Historial de Movimientos</h3>
                        </div>
                        
                        <div className="p-6 flex-grow">
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <Briefcase size={48} className="mx-auto mb-4 text-gray-300"/>
                                    <p>No hay historial de cotizaciones para este cliente.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map(quote => (
                                        <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-border">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${
                                                    quote.status === 'accepted' ? 'bg-green-100 text-green-600' : 
                                                    quote.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {quote.status === 'accepted' ? <DollarSign size={18}/> : <FileText size={18}/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-textPrimary dark:text-dark-textPrimary text-sm">{quote.quotation_number}</p>
                                                    <p className="text-xs text-textSecondary flex items-center gap-1">
                                                        <Calendar size={10}/> {new Date(quote.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-textPrimary dark:text-dark-textPrimary text-sm">{quote.currency} {quote.total_amount.toFixed(2)}</p>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                    quote.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                    {quote.status === 'accepted' ? 'Venta' : quote.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ClientsPage: React.FC<ClientsPageProps> = ({ user }) => {
    const [clients, setClients] = useState<DbClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<DbClient | null>(null);
    const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', document: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [user.id]);

    const fetchClients = async () => {
        try {
            const data = await getClients(user.id);
            setClients(data);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
        setLoading(false);
    };

    const handleOpenModal = (client?: DbClient) => {
        // Don't close detail view if editing from there
        if (client) {
            setEditingClient(client);
            setFormData({ 
                name: client.name, 
                phone: client.phone, 
                email: client.email || '', 
                address: client.address || '',
                document: client.document || ''
            });
        } else {
            setEditingClient(null);
            setFormData({ name: '', phone: '', email: '', address: '', document: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            await saveClient(user.id, {
                id: editingClient?.id,
                ...formData
            });
            await fetchClients();
            
            // If we were editing the currently selected client, update the view
            if (selectedClient && editingClient?.id === selectedClient.id) {
                setSelectedClient({ ...selectedClient, ...formData });
            }
            
            setShowModal(false);
        } catch (error) {
            console.error("Error saving client:", error);
            alert("Error al guardar el cliente. Verifica tu conexión.");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening detail view
        if (window.confirm('¿Estás seguro de eliminar este cliente? Se perderá su historial.')) {
            try {
                await deleteClient(id);
                setClients(clients.filter(c => c.id !== id));
                if (selectedClient?.id === id) setSelectedClient(null);
            } catch (error) {
                console.error("Error deleting client:", error);
            }
        }
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.document && c.document.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

    // Render Detail View if a client is selected
    if (selectedClient) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-6xl mx-auto">
                    <ClientDetailView 
                        client={selectedClient} 
                        onClose={() => setSelectedClient(null)} 
                        onEdit={handleOpenModal} 
                    />
                </div>
                
                {/* Reuse existing Modal for Edit inside Detail View */}
                {showModal && renderModal()}
            </div>
        );
    }

    // Render List View
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Libreta de Clientes
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-teal rounded-full"></span>
                        </h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Gestiona tus contactos y consulta su historial.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <input 
                                type="text" 
                                placeholder="Buscar cliente..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full md:w-64 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Nuevo Cliente</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <div 
                            key={client.id} 
                            onClick={() => setSelectedClient(client)}
                            className="bg-surface dark:bg-dark-surface p-6 rounded-xl border border-border dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <button onClick={(e) => handleDelete(client.id, e)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-10">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                            
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary mb-1 truncate">{client.name}</h3>
                            
                            {client.document ? (
                                <p className="text-xs font-mono bg-gray-100 dark:bg-white/5 inline-block px-2 py-0.5 rounded text-textSecondary mb-3">
                                    ID: {client.document}
                                </p>
                            ) : <div className="h-6 mb-3"></div>}
                            
                            <div className="space-y-2 mt-2 text-sm text-textSecondary dark:text-dark-textSecondary">
                                <div className="flex items-center gap-2"><Phone size={14}/> {client.phone}</div>
                                {client.email && <div className="flex items-center gap-2 truncate"><Mail size={14}/> {client.email}</div>}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-border dark:border-dark-border flex justify-center">
                                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Ver Expediente <ArrowLeft className="rotate-180" size={12}/>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredClients.length === 0 && (
                    <div className="text-center py-12 text-textSecondary dark:text-dark-textSecondary bg-surface dark:bg-dark-surface rounded-xl border border-dashed border-border dark:border-dark-border">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No se encontraron clientes.</p>
                    </div>
                )}
            </div>

            {showModal && renderModal()}
        </div>
    );

    function renderModal() {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="bg-surface dark:bg-dark-surface rounded-2xl w-full max-w-md shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                        <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                        <button onClick={() => setShowModal(false)} className="text-textSecondary hover:text-textPrimary"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Nombre Completo</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Teléfono</label>
                            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary"/>
                        </div>
                        
                            <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Documento (RUC / DNI)</label>
                            <div className="relative">
                                    <FileText size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary" placeholder="Ej. 20123456789"/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Correo Electrónico</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Dirección</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary"/>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-textSecondary hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md disabled:opacity-70">
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
};

export default ClientsPage;
