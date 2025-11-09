

import React, { useState } from 'react';
import { User, Theme } from '../types';
import { Settings as SettingsIcon, LogOut, Sun, Moon, Menu, X, FilePlus, History, SlidersHorizontal } from 'lucide-react';
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

const Sidebar: React.FC<Pick<LayoutProps, 'activePage' | 'setActivePage'>> = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'new_quote', label: 'Nueva Cotización', icon: FilePlus, color: 'text-accent-teal' },
    { id: 'history', label: 'Historial', icon: History, color: 'text-accent-coral' },
    { id: 'settings', label: 'Configuración', icon: SlidersHorizontal, color: 'text-accent-yellow' },
  ];

  return (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5 mb-4">
        <Logo />
      </div>
      <ul className="flex-grow space-y-2 px-2">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setActivePage(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-base font-semibold rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-primary/10 text-primary dark:bg-dark-primary/20 dark:text-dark-primary'
                  : 'text-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-surface'
              }`}
            >
              <item.icon size={22} className={activePage !== item.id ? item.color : ''} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}


const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, activePage, setActivePage, children }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface dark:bg-dark-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-background dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800">
         <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </aside>

      {/* Mobile Sidebar */}
       {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-background dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div onClick={() => setMobileMenuOpen(false)}>
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
               <button className="lg:hidden text-textSecondary dark:text-dark-textSecondary" onClick={() => setMobileMenuOpen(true)}>
                  <Menu size={24} />
               </button>
               <div className="lg:hidden"></div> {/* Spacer for mobile header */}
              <div className="flex items-center gap-4 ml-auto">
                <button onClick={toggleTheme} className="text-textSecondary dark:text-dark-textSecondary hover:text-textPrimary dark:hover:text-dark-textPrimary">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center gap-2"
                  >
                    <div className="w-9 h-9 bg-primary dark:bg-dark-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {user.companyName.charAt(0)}
                    </div>
                  </button>
                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-surface dark:bg-dark-surface rounded-lg shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-textPrimary dark:text-dark-textPrimary truncate">{user.companyName}</p>
                        <p className="text-sm text-textSecondary dark:text-dark-textSecondary">{user.phone}</p>
                      </div>
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        
        <main className="flex-1 overflow-y-auto bg-surface dark:bg-dark-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;