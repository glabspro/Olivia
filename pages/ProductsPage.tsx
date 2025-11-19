
import React, { useState, useEffect } from 'react';
import { DbProduct, User } from '../types';
import { getProducts, saveProduct, deleteProduct } from '../services/supabaseClient';
import { Package, Search, Plus, Edit2, Trash2, X, DollarSign } from 'lucide-react';

interface ProductsPageProps {
    user: User;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ user }) => {
    const [products, setProducts] = useState<DbProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({ name: '', unit_price: 0, currency: 'S/' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [user.id]);

    const fetchProducts = async () => {
        try {
            const data = await getProducts(user.id);
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
        setLoading(false);
    };

    const handleOpenModal = (product?: DbProduct) => {
        if (product) {
            setEditingProduct(product);
            setFormData({ 
                name: product.name, 
                unit_price: product.unit_price, 
                currency: product.currency || 'S/' 
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', unit_price: 0, currency: 'S/' });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            await saveProduct(user.id, {
                id: editingProduct?.id,
                ...formData
            });
            await fetchProducts();
            setShowModal(false);
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar el producto");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
            try {
                await deleteProduct(id);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                            Catálogo de Productos
                            <span className="absolute bottom-0 left-0 h-1 w-16 bg-purple-500 rounded-full"></span>
                        </h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Gestiona tus productos y servicios.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <input 
                                type="text" 
                                placeholder="Buscar producto..." 
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
                            <span className="hidden sm:inline">Nuevo Producto</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-surface dark:bg-dark-surface p-6 rounded-xl border border-border dark:border-dark-border shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-xl font-bold text-purple-500">
                                    <Package size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary mb-1 line-clamp-2 h-14">{product.name}</h3>
                            <div className="mt-4 pt-4 border-t border-border dark:border-dark-border flex items-center justify-between">
                                <span className="text-sm text-textSecondary dark:text-dark-textSecondary">Precio Unitario:</span>
                                <span className="text-lg font-bold text-primary dark:text-dark-primary">{product.currency} {product.unit_price.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-textSecondary dark:text-dark-textSecondary bg-surface dark:bg-dark-surface rounded-xl border border-dashed border-border dark:border-dark-border">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No se encontraron productos en tu catálogo.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-surface dark:bg-dark-surface rounded-2xl w-full max-w-md shadow-2xl border border-border dark:border-dark-border overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-textSecondary hover:text-textPrimary"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Nombre / Descripción</label>
                                <textarea required rows={3} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary resize-none"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Moneda</label>
                                    <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary">
                                        <option value="S/">S/ (Soles)</option>
                                        <option value="$">$ (Dólares)</option>
                                        <option value="€">€ (Euros)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-1">Precio Unitario</label>
                                    <input required type="number" step="0.01" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary"/>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-textSecondary hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md disabled:opacity-70">
                                    {saving ? 'Guardando...' : 'Guardar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
