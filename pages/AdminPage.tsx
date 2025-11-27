
import React, { useState, useEffect } from 'react';
import { User, UserPermissions, SystemConfig } from '../types';
import { getAllUsers, updateUserPermissions, deleteUserProfile, updateUserProfile } from '../services/supabaseClient';
import { Shield, Search, AlertTriangle, Trash2, Briefcase, Users, Crown, Activity, Edit2, Save, X, CheckCircle, Copy, Terminal, CreditCard, Smartphone, Settings as SettingsIcon, Globe } from 'lucide-react';

interface AdminPageProps {
  currentUser: User;
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (config: SystemConfig) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ currentUser, systemConfig, onUpdateSystemConfig }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', companyName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // System Config State - Initialized with your specific numbers
  const [sysConfigForm, setSysConfigForm] = useState<SystemConfig>({
      salesPhoneNumber: '51944894541',
      paymentPhoneNumber: '975615244',
      mercadoPagoPublicKey: '',
      mercadoPagoAccessToken: ''
  });

  useEffect(() => {
    fetchUsers();
    if (systemConfig) {
        setSysConfigForm(prev => ({ ...prev, ...systemConfig }));
    }
  }, [systemConfig]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
  };

  const handlePermissionChange = async (userId: string, currentPermissions: UserPermissions | undefined, field: keyof UserPermissions) => {
      const oldPerms = currentPermissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
      const newPerms = { ...oldPerms, [field]: !oldPerms[field] };
      setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPerms } : u));

      try {
          await updateUserPermissions(userId, newPerms);
          showNotification('success', 'Permisos actualizados');
      } catch (error: any) {
          setUsers(users.map(u => u.id === userId ? { ...u, permissions: oldPerms } : u));
      }
  };

  const handlePlanChange = async (userId: string, currentPermissions: UserPermissions | undefined, newPlan: 'free' | 'pro' | 'enterprise') => {
      const oldPerms = currentPermissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
      const newPerms = { ...oldPerms, plan: newPlan };
      setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPerms } : u));

      try {
          await updateUserPermissions(userId, newPerms);
          showNotification('success', `Plan cambiado a ${newPlan.toUpperCase()}`);
      } catch (error: any) {
          setUsers(users.map(u => u.id === userId ? { ...u, permissions: oldPerms } : u));
      }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
      if (window.confirm(`¿Estás SEGURO de eliminar al usuario "${userName}"?`)) {
          try {
              await deleteUserProfile(userId);
              setUsers(users.filter(u => u.id !== userId));
              showNotification('success', 'Usuario eliminado');
          } catch (error: any) {
               showNotification('error', 'Error al eliminar');
          }
      }
  };
  
  const handleEditClick = (user: User) => {
      setEditingUser(user);
      setEditForm({ fullName: user.fullName, companyName: user.companyName, phone: user.phone });
      setShowEditModal(true);
  };
  
  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setSaving(true);
      try {
          await updateUserProfile(editingUser.id, editForm);
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
          setShowEditModal(false);
          setEditingUser(null);
          showNotification('success', 'Usuario actualizado');
      } catch (error: any) {
          showNotification('error', 'Error al actualizar');
      } finally {
          setSaving(false);
      }
  };

  const handleSaveSystemConfig = (e: React.FormEvent) => {
      e.preventDefault();
      if (onUpdateSystemConfig) {
          onUpdateSystemConfig(sysConfigForm);
          showNotification('success', 'Configuración del Sistema Guardada');
      }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.permissions?.is_active !== false).length,
      proUsers: users.filter(u => u.permissions?.plan === 'pro' || u.permissions?.plan === 'enterprise').length
  };

  if (!currentUser.is_admin) return <div className="h-full flex flex-col items-center justify-center p-8 text-red-500"><AlertTriangle size={48} /><h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1></div>;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 relative">
      {notification && (
        <div className={`fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header & Stats */}
      <div className="mb-8">
         <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-3">
                    <Shield className="text-red-500" size={32}/>
                    Panel Super Admin
                </h1>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-1">Gestión centralizada de Olivia SaaS.</p>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            <div className="bg-surface dark:bg-dark-surface p-3 md:p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                <div><p className="text-[10px] md:text-xs text-textSecondary uppercase font-bold">Usuarios</p><p className="text-xl md:text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">{stats.totalUsers}</p></div><Users className="text-blue-500 mt-1 md:mt-0" size={20}/>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-3 md:p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                <div><p className="text-[10px] md:text-xs text-textSecondary uppercase font-bold">Activos</p><p className="text-xl md:text-2xl font-bold text-green-500">{stats.activeUsers}</p></div><Activity className="text-green-500 mt-1 md:mt-0" size={20}/>
            </div>
             <div className="bg-surface dark:bg-dark-surface p-3 md:p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                <div><p className="text-[10px] md:text-xs text-textSecondary uppercase font-bold">Pro</p><p className="text-xl md:text-2xl font-bold text-purple-500">{stats.proUsers}</p></div><Crown className="text-purple-500 mt-1 md:mt-0" size={20}/>
            </div>
         </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border dark:border-dark-border">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
          >
              <Users size={16}/> Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('system')} 
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'system' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
          >
              <SettingsIcon size={16}/> Configuración del Sistema
          </button>
      </div>

      {activeTab === 'users' ? (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 animate-fade-in">
                <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary self-start md:self-center">Lista de Usuarios Registrados</h2>
                <div className="relative w-full md:w-auto">
                    <input type="text" placeholder="Buscar por nombre, empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-sm w-full md:w-72 focus:ring-2 focus:ring-primary focus:outline-none shadow-sm"/>
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border overflow-hidden shadow-sm animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-textSecondary dark:text-dark-textSecondary uppercase font-semibold text-xs">
                            <tr>
                                <th className="px-6 py-4">Usuario / Negocio</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-center">Plan Actual</th>
                                <th className="px-6 py-4 text-center">Permisos</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {filteredUsers.map(user => {
                                const perms = user.permissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
                                const isSelf = user.id === currentUser.id;
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2">{user.companyName}{user.is_admin && <Shield size={12} className="text-red-500" fill="currentColor"/>}</div>
                                            <div className="text-xs text-textSecondary dark:text-dark-textSecondary flex items-center gap-1"><Briefcase size={10}/> {user.fullName}</div>
                                        </td>
                                        <td className="px-6 py-4"><div className="text-textPrimary dark:text-dark-textPrimary font-mono text-xs">{user.phone}</div></td>
                                        <td className="px-6 py-4 text-center">
                                            <select value={perms.plan} onChange={(e) => handlePlanChange(user.id, user.permissions, e.target.value as any)} className={`cursor-pointer border border-border dark:border-dark-border text-xs font-semibold rounded px-2 py-1 focus:outline-none uppercase ${perms.plan === 'pro' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                <option value="free">Free</option>
                                                <option value="pro">Pro</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => !isSelf && handlePermissionChange(user.id, user.permissions, 'is_active')} disabled={isSelf} className={`text-xs font-bold px-3 py-1 rounded border transition-all ${isSelf ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'} ${perms.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>{perms.is_active ? 'ACTIVO' : 'BLOQUEADO'}</button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditClick(user)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDeleteUser(user.id, user.companyName)} disabled={isSelf} className={`p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ${isSelf ? 'invisible' : ''}`}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-4 animate-fade-in">
              {filteredUsers.map(user => {
                  const perms = user.permissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
                  const isSelf = user.id === currentUser.id;
                  
                  return (
                      <div key={user.id} className="bg-surface dark:bg-dark-surface p-5 rounded-xl border border-border dark:border-dark-border shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary line-clamp-1">{user.companyName}</h3>
                                  <p className="text-sm text-textSecondary dark:text-dark-textSecondary flex items-center gap-1 mt-1">
                                      <Briefcase size={12}/> {user.fullName}
                                  </p>
                                  <p className="text-xs text-textSecondary dark:text-dark-textSecondary font-mono mt-1 bg-gray-100 dark:bg-white/5 inline-block px-2 py-0.5 rounded">{user.phone}</p>
                              </div>
                          </div>
                          <div className="mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                              <label className="text-xs font-bold text-textSecondary uppercase mb-2 block">Plan</label>
                               <select value={perms.plan} onChange={(e) => handlePlanChange(user.id, user.permissions, e.target.value as any)} className={`w-full border-2 border-transparent font-bold rounded-lg px-3 py-3 focus:outline-none uppercase text-center cursor-pointer ${perms.plan === 'pro' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-800 shadow-sm border-gray-200'}`}>
                                    <option value="free">GRATIS</option>
                                    <option value="pro">PRO</option>
                                </select>
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-2">
                                <button onClick={() => handleEditClick(user)} className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl active:scale-95 transition-transform"><Edit2 size={20} className="mb-1"/><span className="text-[10px] font-bold uppercase">Editar</span></button>
                                <button onClick={() => !isSelf && handlePermissionChange(user.id, user.permissions, 'is_active')} disabled={isSelf} className={`flex flex-col items-center justify-center p-3 rounded-xl active:scale-95 transition-transform ${perms.is_active ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'}`}>{perms.is_active ? <Shield size={20} className="mb-1"/> : <AlertTriangle size={20} className="mb-1"/>}<span className="text-[10px] font-bold uppercase">{perms.is_active ? 'Bloquear' : 'Desbloq.'}</span></button>
                               <button onClick={() => handleDeleteUser(user.id, user.companyName)} disabled={isSelf} className={`flex flex-col items-center justify-center p-3 text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-xl active:scale-95 transition-transform ${isSelf ? 'opacity-30' : ''}`}><Trash2 size={20} className="mb-1" /><span className="text-[10px] font-bold uppercase">Eliminar</span></button>
                          </div>
                      </div>
                  );
              })}
            </div>
        </>
      ) : (
        /* SYSTEM CONFIG TAB */
        <div className="max-w-4xl animate-fade-in mx-auto">
             <div className="bg-surface dark:bg-dark-surface p-8 rounded-xl border border-border dark:border-dark-border shadow-md mb-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border dark:border-dark-border">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600"><Globe size={32}/></div>
                    <div>
                        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Variables Globales del Sistema</h2>
                        <p className="text-sm text-textSecondary mt-1">Define los números de contacto y claves API que utilizará toda la aplicación.</p>
                    </div>
                </div>
                
                <form onSubmit={handleSaveSystemConfig} className="space-y-8">
                    
                    {/* Sección 1: Contacto */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2 text-lg"><Smartphone className="text-blue-500"/> Canales de Atención</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-textSecondary dark:text-dark-textSecondary mb-2">WhatsApp de Ventas</label>
                                <p className="text-xs text-textSecondary mb-3 bg-blue-50 dark:bg-blue-900/10 p-2 rounded border border-blue-100 dark:border-blue-800">
                                    A este número llegarán los mensajes de clientes queriendo comprar el Plan Pro.
                                </p>
                                <input type="text" value={sysConfigForm.salesPhoneNumber} onChange={e => setSysConfigForm({...sysConfigForm, salesPhoneNumber: e.target.value})} className="w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-lg" placeholder="51944894541"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-textSecondary dark:text-dark-textSecondary mb-2">Número Yape/Plin (Cobros)</label>
                                <p className="text-xs text-textSecondary mb-3 bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-100 dark:border-green-800">
                                    Este número se mostrará en el Modal de "Mejorar Plan" para pagos rápidos.
                                </p>
                                <input type="text" value={sysConfigForm.paymentPhoneNumber} onChange={e => setSysConfigForm({...sysConfigForm, paymentPhoneNumber: e.target.value})} className="w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-lg" placeholder="975615244"/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-border dark:border-dark-border my-6"></div>

                    {/* Sección 2: MercadoPago */}
                    <div className="space-y-4">
                         <h3 className="font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2 text-lg"><Terminal className="text-teal-500"/> Integración MercadoPago</h3>
                         <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-border dark:border-dark-border">
                             <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="text-orange-500 mt-0.5" size={18}/>
                                <p className="text-sm text-textSecondary">Coloca aquí tus credenciales de producción o pruebas para habilitar pagos con tarjeta en el futuro.</p>
                             </div>
                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Public Key</label>
                                     <input type="text" value={sysConfigForm.mercadoPagoPublicKey || ''} onChange={e => setSysConfigForm({...sysConfigForm, mercadoPagoPublicKey: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-black border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm" placeholder="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Access Token</label>
                                     <input type="password" value={sysConfigForm.mercadoPagoAccessToken || ''} onChange={e => setSysConfigForm({...sysConfigForm, mercadoPagoAccessToken: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-black border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm" placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="pt-6 flex justify-end sticky bottom-0 bg-surface dark:bg-dark-surface py-4 border-t border-transparent">
                        <button type="submit" className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-3 transform hover:scale-105">
                            <Save size={20}/> Guardar Cambios del Sistema
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}
      
      {/* Edit User Modal (Same as before) */}
      {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-surface dark:bg-dark-surface rounded-2xl w-full max-w-md shadow-2xl border border-border dark:border-dark-border animate-fade-in">
                  <div className="px-6 py-4 border-b border-border dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary">Editar Usuario</h3>
                      <button onClick={() => setShowEditModal(false)} className="text-textSecondary hover:text-textPrimary"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                      <div><label className="block text-sm font-medium text-textSecondary mb-1">Nombre Completo</label><input type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"/></div>
                      <div><label className="block text-sm font-medium text-textSecondary mb-1">Nombre del Negocio</label><input type="text" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"/></div>
                      <div><label className="block text-sm font-medium text-textSecondary mb-1">Teléfono</label><input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"/></div>
                      <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-textSecondary hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Cancelar</button><button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md flex items-center justify-center gap-2">{saving ? 'Guardando...' : <><Save size={16}/> Guardar Cambios</>}</button></div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPage;
