
import React, { useState } from 'react';
import { User, Theme } from '../types';
import { Settings as SettingsIcon, LogOut, Sun, Moon, FilePlus, LayoutDashboard, SlidersHorizontal, Users, Package, Shield, ChevronDown } from 'lucide-react';
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
            className={`w-full flex ${isMobile ? 'flex-col items-center justify-center h-full py-1' : 'items-center gap-3 px-3 py-2'} font-medium rounded-lg transition-colors duration-200 relative ${
            isActive
                ? 'text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10'
                : 'text-textSecondary dark:text-dark-textSecondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
        <Icon size={isMobile ? 20 : 20} className={`${isActive ? 'text-primary' : colorClass}`} />
        <span className={isMobile ? 'text-[10px] mt-0.5 leading-tight text-center' : 'text-sm'}>{label}</span>
        </button>
    );
}


const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, activePage, setActivePage, children }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: 'history', label: 'Dashboard', icon: LayoutDashboard, colorClass: 'text-accent-coral' },
    { id: 'new_quote', label: 'Crear', icon: FilePlus, colorClass: 'text-accent-teal' },
    { id: 'products', label: 'Catálogo', icon: Package, colorClass: 'text-purple-500' },
    { id: 'clients', label: 'Clientes', icon: Users, colorClass: 'text-blue-500' },
    { id: 'settings', label: 'Ajustes', icon: SlidersHorizontal, colorClass: 'text-accent-yellow' },
  ];

  // Add Admin item if user is admin
  if (user.is_admin) {
      navItems.push({ id: 'admin', label: 'Admin', icon: Shield, colorClass: 'text-red-500' });
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
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-border dark:border-dark-border sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
               <div className="lg:hidden">
                 <Logo />
               </div>
               
               {/* Spacer to push profile to right on mobile or if logo is hidden on desktop */}
               <div className="flex-1 lg:hidden"></div>

              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={toggleTheme} className="text-textSecondary dark:text-dark-textSecondary hover:text-textPrimary dark:hover:text-dark-textPrimary p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                
                {/* Profile Dropdown (Prominent Position) */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border transition-all"
                  >
                    <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {user.companyName.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-semibold text-textPrimary dark:text-dark-textPrimary leading-tight">{user.companyName}</span>
                        <span className="text-xs text-textSecondary dark:text-dark-textSecondary">Propietario</span>
                    </div>
                    <ChevronDown size={16} className="text-textSecondary hidden md:block"/>
                  </button>

                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-surface dark:bg-dark-surface rounded-xl shadow-xl py-2 z-50 border border-border dark:border-dark-border animate-fade-in"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-3 border-b border-border dark:border-dark-border md:hidden">
                        <p className="font-semibold text-textPrimary dark:text-dark-textPrimary truncate">{user.companyName}</p>
                        <p className="text-sm text-textSecondary dark:text-dark-textSecondary">{user.phone}</p>
                      </div>
                      <div className="px-4 py-3 border-b border-border dark:border-dark-border hidden md:block">
                        <p className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Cuenta</p>
                        <p className="font-medium text-textPrimary dark:text-dark-textPrimary truncate">{user.fullName}</p>
                        <p className="text-sm text-textSecondary dark:text-dark-textSecondary">{user.phone}</p>
                         {user.is_admin && <span className="mt-1 inline-block text-xs text-red-500 font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded">Admin</span>}
                      </div>

                       <button 
                        onClick={() => setActivePage('settings')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textSecondary dark:text-dark-textSecondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <SettingsIcon size={16} /> Mi Perfil / Configuración
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
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
        
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-background dark:bg-dark-background">
          {children}
        </main>
      </div>

       {/* Mobile Bottom Navigation - Updated to show all items */}
       <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/95 dark:bg-dark-surface/95 backdrop-blur-lg border-t border-border dark:border-dark-border flex justify-between px-2 items-center lg:hidden z-20">
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} isMobile={true} />)}
       </nav>
    </div>
  );
};

export default Layout;
