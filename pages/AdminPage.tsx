
import React, { useState, useEffect } from 'react';
import { User, UserPermissions } from '../types';
import { getAllUsers, updateUserPermissions, deleteUserProfile } from '../services/supabaseClient';
import { Shield, Search, Check, X, AlertTriangle, Trash2, Briefcase, Users, Crown, Activity } from 'lucide-react';

interface AdminPageProps {
  currentUser: User;
}

const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, currentPermissions: UserPermissions | undefined, field: keyof UserPermissions) => {
      const oldPerms = currentPermissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
      const newPerms = { ...oldPerms, [field]: !oldPerms[field] };
      
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPerms } : u));

      try {
          await updateUserPermissions(userId, newPerms);
      } catch (error) {
          console.error("Failed to update permissions", error);
          // Revert on error
          setUsers(users.map(u => u.id === userId ? { ...u, permissions: oldPerms } : u));
      }
  };

  const handlePlanChange = async (userId: string, currentPermissions: UserPermissions | undefined, newPlan: 'free' | 'pro' | 'enterprise') => {
      const oldPerms = currentPermissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
      const newPerms = { ...oldPerms, plan: newPlan };

      setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPerms } : u));

      try {
          await updateUserPermissions(userId, newPerms);
      } catch (error) {
          console.error("Failed to update plan", error);
          setUsers(users.map(u => u.id === userId ? { ...u, permissions: oldPerms } : u));
      }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
      if (window.confirm(`¿Estás SEGURO de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
          try {
              await deleteUserProfile(userId);
              setUsers(users.filter(u => u.id !== userId));
          } catch (error) {
              console.error("Error deleting user:", error);
              alert("Error al eliminar usuario. Puede tener datos relacionados.");
          }
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

  if (!currentUser.is_admin) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-red-500">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                 <AlertTriangle size={48} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
              <p className="text-textSecondary">No tienes permisos de administrador para ver esta página.</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header & Stats */}
      <div className="mb-8">
         <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-3">
                    <Shield className="text-red-500" size={32}/>
                    Panel de Administración
                </h1>
                <p className="text-textSecondary dark:text-dark-textSecondary mt-1">
                    Bienvenido, Super Admin <strong>{currentUser.fullName}</strong>. Tienes el control total.
                </p>
            </div>
            <div className="hidden md:block">
                 <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg animate-pulse">
                    MODO SUPER ADMIN
                 </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface dark:bg-dark-surface p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-textSecondary uppercase font-bold">Usuarios Totales</p>
                    <p className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">{stats.totalUsers}</p>
                </div>
                <Users className="text-blue-500" size={24}/>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-textSecondary uppercase font-bold">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
                </div>
                <Activity className="text-green-500" size={24}/>
            </div>
             <div className="bg-surface dark:bg-dark-surface p-4 rounded-xl border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-textSecondary uppercase font-bold">Planes Premium</p>
                    <p className="text-2xl font-bold text-purple-500">{stats.proUsers}</p>
                </div>
                <Crown className="text-purple-500" size={24}/>
            </div>
         </div>
      </div>

      {/* Search & Table */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">Lista de Usuarios</h2>
        <div className="relative">
            <input 
                type="text" 
                placeholder="Buscar por nombre, negocio o teléfono..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-sm w-full md:w-72 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-textSecondary dark:text-dark-textSecondary uppercase font-semibold text-xs">
                    <tr>
                        <th className="px-6 py-4">Usuario / Negocio</th>
                        <th className="px-6 py-4">Contacto</th>
                        <th className="px-6 py-4 text-center">Onboarding</th>
                        <th className="px-6 py-4 text-center">Plan Actual</th>
                        <th className="px-6 py-4 text-center">Permisos (IA / PDF)</th>
                        <th className="px-6 py-4 text-center">Acceso</th>
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
                                    <div className="font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                                        {user.companyName}
                                        {user.is_admin && <Shield size={12} className="text-red-500" fill="currentColor"/>}
                                    </div>
                                    <div className="text-xs text-textSecondary dark:text-dark-textSecondary flex items-center gap-1">
                                        <Briefcase size={10}/> {user.fullName}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-textPrimary dark:text-dark-textPrimary font-mono text-xs">{user.phone}</div>
                                    <div className="text-xs text-textSecondary dark:text-dark-textSecondary truncate max-w-[150px]">{user.email || '-'}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {user.is_onboarded ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            COMPLETO
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                            PENDIENTE
                                        </span>
                                    )}
                                </td>
                                
                                {/* Plan Selector */}
                                <td className="px-6 py-4 text-center">
                                    <select
                                        value={perms.plan}
                                        onChange={(e) => handlePlanChange(user.id, user.permissions, e.target.value as any)}
                                        className={`border border-border dark:border-dark-border text-xs font-semibold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary uppercase ${
                                            perms.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                            perms.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </td>

                                {/* Permission Toggles */}
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            title={perms.can_use_ai ? "Desactivar IA" : "Activar IA"}
                                            onClick={() => handlePermissionChange(user.id, user.permissions, 'can_use_ai')}
                                            className={`p-1.5 rounded transition-colors ${perms.can_use_ai ? 'text-white bg-green-500 shadow-sm' : 'text-gray-400 bg-gray-200 dark:bg-gray-700'}`}
                                        >
                                            <span className="text-[10px] font-bold">IA</span>
                                        </button>
                                        <button 
                                            title={perms.can_download_pdf ? "Desactivar PDF" : "Activar PDF"}
                                            onClick={() => handlePermissionChange(user.id, user.permissions, 'can_download_pdf')}
                                            className={`p-1.5 rounded transition-colors ${perms.can_download_pdf ? 'text-white bg-blue-500 shadow-sm' : 'text-gray-400 bg-gray-200 dark:bg-gray-700'}`}
                                        >
                                            <span className="text-[10px] font-bold">PDF</span>
                                        </button>
                                    </div>
                                </td>

                                {/* Access Control (Block) */}
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => !isSelf && handlePermissionChange(user.id, user.permissions, 'is_active')}
                                        disabled={isSelf}
                                        className={`text-xs font-bold px-3 py-1 rounded border transition-all ${isSelf ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'} ${perms.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}
                                    >
                                        {perms.is_active ? 'ACTIVO' : 'BLOQUEADO'}
                                    </button>
                                </td>

                                {/* Delete Action */}
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.companyName)}
                                        disabled={isSelf}
                                        className={`p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ${isSelf ? 'invisible' : ''}`}
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
