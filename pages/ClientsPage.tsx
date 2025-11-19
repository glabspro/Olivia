
import React, { useState, useEffect } from 'react';
import { DbClient, User } from '../types';
import { getClients, saveClient, deleteClient } from '../services/supabaseClient';
import { Users, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, X } from 'lucide-react';

interface ClientsPageProps {
    user: User;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ user }) => {
    const [clients, setClients] = useState<DbClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<DbClient | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
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
        if (client) {
            setEditingClient(client);
            setFormData({ 
                name: client.name, 
                phone: client.phone, 
                email: client.email || '', 
                address: client.address || '' 
            });
        } else {
            setEditingClient(null);
            setFormData({ name: '', phone: '', email: '', address: '' });
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
            setShowModal(false);
        } catch (error) {
            console.error("Error saving client:", error);
            alert("Error al guardar el cliente");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                await deleteClient(id);
                setClients(clients.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting client:", error);
            }
        }
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Libreta de Clientes
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-teal rounded-full"></span>
                        </h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Gestiona tus contactos y su información.</p>
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
                        <div key={client.id} className="bg-surface dark:bg-dark-surface p-6 rounded-xl border border-border dark:border-dark-border shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-500">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(client)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(client.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary mb-1">{client.name}</h3>
                            <div className="space-y-2 mt-4 text-sm text-textSecondary dark:text-dark-textSecondary">
                                <div className="flex items-center gap-2"><Phone size={14}/> {client.phone}</div>
                                {client.email && <div className="flex items-center gap-2"><Mail size={14}/> {client.email}</div>}
                                {client.address && <div className="flex items-center gap-2"><MapPin size={14}/> {client.address}</div>}
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

            {/* Modal */}
            {showModal && (
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
                                    {saving ? 'Guardando...' : 'Guardar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
