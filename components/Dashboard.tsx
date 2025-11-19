
import React, { useState } from 'react';
import { User, Theme } from '../types';
import { Settings as SettingsIcon, LogOut, Sun, Moon, FilePlus, LayoutDashboard, SlidersHorizontal, Users, Package, Shield } from 'lucide-react';
import Logo from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: 'new_quote' | 'history' | 'clients' | 'products' | 'settings' | 'admin') => void;
  children: React.ReactNode;
}

const NavItem = ({ id, label, icon: Icon, activePage, setActivePage, isMobile = false, colorClass }: any) => {
    const isActive = activePage === id;
    return (
        <button
            onClick={() => setActivePage(id)}
            className={`w-full flex ${isMobile ? 'flex-col items-center justify-center h-full' : 'items-center gap-3'} px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 relative ${
            isActive
                ? 'text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10'
                : 'text-textSecondary dark:text-dark-textSecondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
        <Icon size={isMobile ? 24 : 20} className={`${isActive ? 'text-primary' : colorClass}`} />
        <span className={isMobile ? 'text-xs mt-1' : ''}>{label}</span>
        </button>
    );
}


const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, activePage, setActivePage, children }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: 'history', label: 'Dashboard', icon: LayoutDashboard, colorClass: 'text-accent-coral' },
    { id: 'new_quote', label: 'Nueva Cotización', icon: FilePlus, colorClass: 'text-accent-teal' },
    { id: 'products', label: 'Catálogo', icon: Package, colorClass: 'text-purple-500' },
    { id: 'clients', label: 'Clientes', icon: Users, colorClass: 'text-blue-500' },
    { id: 'settings', label: 'Configuración', icon: SlidersHorizontal, colorClass: 'text-accent-yellow' },
  ];

  // Add Admin item if user is admin
  if (user.is_admin) {
      navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield, colorClass: 'text-red-500' });
  }

  return (
    <div className="flex h-screen bg-background text-textPrimary dark:bg-dark-background dark:text-dark-textPrimary">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface dark:bg-dark-surface flex-col border-r border-border dark:border-dark-border">
         <div className="px-6 py-5 border-b border-border dark:border-dark-border">
            <Logo />
         </div>
         <nav className="flex-grow px-4 py-4 space-y-1">
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} />)}
         </nav>
         
         {/* Bottom Profile Section in Sidebar */}
         <div className="p-4 border-t border-border dark:border-dark-border">
             <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                 <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {user.companyName.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-textPrimary dark:text-dark-textPrimary truncate">{user.companyName}</p>
                     <p className="text-xs text-textSecondary dark:text-dark-textSecondary truncate">Ver perfil</p>
                 </div>
             </div>
         </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-border dark:border-dark-border sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
               <div className="lg:hidden">
                 <Logo />
               </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="text-textSecondary dark:text-dark-textSecondary hover:text-textPrimary dark:hover:text-dark-textPrimary p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                
                {/* Profile Dropdown (Top Right) - mainly for Mobile or quick access */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {user.companyName.charAt(0)}
                    </div>
                  </button>
                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-surface dark:bg-dark-surface rounded-xl shadow-xl py-2 z-50 border border-border dark:border-dark-border animate-fade-in"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-3 border-b border-border dark:border-dark-border">
                        <p className="font-semibold text-textPrimary dark:text-dark-textPrimary truncate">{user.companyName}</p>
                        <p className="text-sm text-textSecondary dark:text-dark-textSecondary">{user.phone}</p>
                        {user.is_admin && <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Administrador</span>}
                      </div>
                       <button 
                        onClick={() => setActivePage('settings')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textSecondary dark:text-dark-textSecondary hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <SettingsIcon size={16} /> Mi Perfil / Configuración
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

       {/* Mobile Bottom Navigation */}
       <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/90 dark:bg-dark-surface/90 backdrop-blur-lg border-t border-border dark:border-dark-border flex justify-around items-center lg:hidden z-20">
            {navItems.slice(0, 5).map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} isMobile={true} />)}
       </nav>
    </div>
  );
};

export default Layout;
