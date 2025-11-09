import React, { useState } from 'react';
import { User, Theme } from '../types';
import { Settings as SettingsIcon, LogOut, Sun, Moon, FilePlus, History, SlidersHorizontal } from 'lucide-react';
import Logo from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: 'new_quote' | 'history' | 'settings') => void;
  children: React.ReactNode;
}

const NavItem = ({ id, label, icon: Icon, activePage, setActivePage, isMobile = false }: any) => {
    const isActive = activePage === id;
    return (
        <button
            onClick={() => setActivePage(id)}
            className={`w-full flex ${isMobile ? 'flex-col items-center justify-center' : 'items-center gap-3'} px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 relative ${
            isActive
                ? 'text-primary-dark dark:text-primary-dark'
                : 'text-textSecondary dark:text-dark-textSecondary hover:bg-surface dark:hover:bg-dark-surface'
            }`}
        >
        {!isMobile && (
             <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-primary transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>
        )}
        {isMobile && isActive && (
             <div className="absolute top-0 h-1 w-8 rounded-b-full bg-primary transition-transform duration-300"></div>
        )}

        <Icon size={22} />
        <span className={isMobile ? 'text-xs mt-1' : ''}>{label}</span>
        </button>
    );
}


const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, activePage, setActivePage, children }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: 'new_quote', label: 'Nueva Cotización', icon: FilePlus },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'settings', label: 'Configuración', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface dark:bg-dark-surface flex-col border-r border-border dark:border-dark-border">
         <div className="px-6 py-5">
            <Logo />
         </div>
         <nav className="flex-grow px-4 space-y-2">
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} />)}
         </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-border dark:border-dark-border sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="text-textSecondary dark:text-dark-textSecondary hover:text-textPrimary dark:hover:text-dark-textPrimary p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {user.companyName.charAt(0)}
                    </div>
                  </button>
                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-surface dark:bg-dark-surface rounded-xl shadow-xl py-2 z-50 border border-border dark:border-dark-border"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-3 border-b border-border dark:border-dark-border">
                        <p className="font-semibold text-textPrimary dark:text-dark-textPrimary truncate">{user.companyName}</p>
                        <p className="text-sm text-textSecondary dark:text-dark-textSecondary">{user.phone}</p>
                      </div>
                       <button 
                        onClick={() => setActivePage('settings')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-background/50"
                      >
                        <SettingsIcon size={16} /> Configuración
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-background/50"
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
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} isMobile={true} />)}
       </nav>
    </div>
  );
};

export default Layout;