
import React, { useState, useEffect } from 'react';
import { User, UserPermissions } from '../types';
import { getAllUsers, updateUserPermissions } from '../services/supabaseClient';
import { Shield, Search, Check, X, AlertTriangle } from 'lucide-react';

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

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  if (!currentUser.is_admin) {
      return (
          <div className="p-8 text-center text-red-500">
              <AlertTriangle size={48} className="mx-auto mb-4"/>
              <h1 className="text-2xl font-bold">Acceso Denegado</h1>
              <p>No tienes permisos de administrador para ver esta página.</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-3">
            <Shield className="text-primary" size={32}/>
            Panel de Administración
        </h1>
        <div className="relative">
            <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-sm w-64"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-textSecondary dark:text-dark-textSecondary uppercase font-semibold">
                <tr>
                    <th className="px-6 py-4">Usuario / Negocio</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">IA</th>
                    <th className="px-6 py-4 text-center">PDF</th>
                    <th className="px-6 py-4 text-center">Acceso</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-dark-border">
                {filteredUsers.map(user => {
                    const perms = user.permissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true };
                    return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-6 py-4">
                                <div className="font-bold text-textPrimary dark:text-dark-textPrimary">{user.companyName}</div>
                                <div className="text-xs text-textSecondary dark:text-dark-textSecondary">{user.fullName}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-textPrimary dark:text-dark-textPrimary">{user.phone}</div>
                                <div className="text-xs text-textSecondary dark:text-dark-textSecondary">{user.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {user.is_onboarded ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        Completo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                        Pendiente
                                    </span>
                                )}
                            </td>
                            
                            {/* Feature Toggles */}
                            <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handlePermissionChange(user.id, user.permissions, 'can_use_ai')}
                                    className={`p-1 rounded ${perms.can_use_ai ? 'text-green-500 bg-green-100 dark:bg-green-900/20' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}
                                >
                                    {perms.can_use_ai ? <Check size={18}/> : <X size={18}/>}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handlePermissionChange(user.id, user.permissions, 'can_download_pdf')}
                                    className={`p-1 rounded ${perms.can_download_pdf ? 'text-green-500 bg-green-100 dark:bg-green-900/20' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}
                                >
                                    {perms.can_download_pdf ? <Check size={18}/> : <X size={18}/>}
                                </button>
                            </td>
                             <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handlePermissionChange(user.id, user.permissions, 'is_active')}
                                    className={`text-xs font-bold px-3 py-1 rounded border ${perms.is_active ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/10'}`}
                                >
                                    {perms.is_active ? 'Activo' : 'Bloqueado'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;
