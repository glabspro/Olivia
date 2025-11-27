
import React, { useState, useEffect } from 'react';
import { User, Theme } from '../types';
import { Settings as SettingsIcon, LogOut, Sun, Moon, FilePlus, LayoutDashboard, SlidersHorizontal, Users, Package, Shield, ChevronDown, ClipboardList, Crown, Clock } from 'lucide-react';
import Logo from './Logo';
import QuickTaskFab from './QuickTaskFab';
import { getPendingTaskCount } from '../services/supabaseClient';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: 'new_quote' | 'history' | 'clients' | 'products' | 'settings' | 'admin' | 'tasks') => void;
  children: React.ReactNode;
}

const NavItem = ({ id, label, icon: Icon, activePage, setActivePage, isMobile = false, colorClass, badge }: any) => {
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
        <div className="relative">
            <Icon size={isMobile ? 20 : 20} className={`${isActive ? 'text-primary' : colorClass}`} />
            {badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-surface dark:border-dark-surface">
                    {badge}
                </span>
            )}
        </div>
        <span className={isMobile ? 'text-[10px] mt-0.5 leading-tight text-center' : 'text-sm'}>{label}</span>
        </button>
    );
}

const PlanBadge = ({ user }: { user: User }) => {
    const isPro = user.permissions?.plan === 'pro' || user.permissions?.plan === 'enterprise';
    const trialEnds = user.permissions?.trial_ends_at ? new Date(user.permissions.trial_ends_at) : null;
    const now = new Date();
    
    let daysLeft = 0;
    if (trialEnds && trialEnds > now) {
        const diffTime = Math.abs(trialEnds.getTime() - now.getTime());
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (isPro) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${trialEnds ? 'bg-orange-100 text-orange-700' : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'}`}>
                {trialEnds ? <Clock size={10} /> : <Crown size={10} />}
                {trialEnds ? `${daysLeft} Días Prueba` : 'Plan PRO'}
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-bold uppercase">
            Plan Free
        </div>
    );
}


const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, activePage, setActivePage, children }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);

  useEffect(() => {
      const fetchCount = async () => {
          const count = await getPendingTaskCount(user.id);
          setPendingTasks(count);
      };
      fetchCount();
      // Refresh every time active page changes to 'tasks' to ensure count is accurate
      if (activePage === 'tasks' || activePage === 'history') {
          fetchCount();
      }
  }, [user.id, activePage]);

  const navItems = [
    { id: 'history', label: 'Dashboard', icon: LayoutDashboard, colorClass: 'text-accent-coral' },
    { id: 'tasks', label: 'Tareas', icon: ClipboardList, colorClass: 'text-cyan-500', badge: pendingTasks },
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-textPrimary dark:bg-dark-background dark:text-dark-textPrimary">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface dark:bg-dark-surface flex-col border-r border-border dark:border-dark-border flex-shrink-0">
         <div className="px-6 py-5 border-b border-border dark:border-dark-border">
            <Logo />
         </div>
         <nav className="flex-grow px-4 py-4 space-y-1">
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} />)}
         </nav>
         
         {/* Plan Status in Sidebar Footer */}
         <div className="p-4 border-t border-border dark:border-dark-border">
             <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-textSecondary uppercase">Tu Plan</span>
                     <PlanBadge user={user} />
                 </div>
                 {user.permissions?.plan === 'free' && (
                     <p className="text-[10px] text-textSecondary leading-tight">
                         Límite: 5 cotizaciones/mes.
                     </p>
                 )}
                 {user.permissions?.trial_ends_at && (
                     <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium leading-tight mt-1">
                         Aprovecha las funciones PRO antes de que termine.
                     </p>
                 )}
             </div>
         </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-surface/95 dark:bg-dark-surface/95 backdrop-blur-sm border-b border-border dark:border-dark-border z-30 flex-shrink-0 sticky top-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
               <div className="lg:hidden flex-shrink-0 flex items-center gap-2">
                 <Logo />
                 <div className="md:hidden"><PlanBadge user={user} /></div>
               </div>
               
               {/* Spacer to push profile to right on mobile or if logo is hidden on desktop */}
               <div className="flex-1 lg:hidden"></div>

              <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                <button onClick={toggleTheme} className="text-textSecondary dark:text-dark-textSecondary hover:text-textPrimary dark:hover:text-dark-textPrimary p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                
                {/* Profile Dropdown (Prominent Position) */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    className="flex items-center gap-2 md:gap-3 pl-1 pr-2 md:pr-3 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border transition-all"
                  >
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {user.companyName.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-semibold text-textPrimary dark:text-dark-textPrimary leading-tight max-w-[100px] truncate">{user.companyName}</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-textSecondary dark:text-dark-textSecondary">Propietario</span>
                            {user.permissions?.plan === 'pro' && <Crown size={10} className="text-yellow-500" />}
                        </div>
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
                        <div className="mt-2"><PlanBadge user={user} /></div>
                      </div>
                      <div className="px-4 py-3 border-b border-border dark:border-dark-border hidden md:block">
                        <div className="flex justify-between items-center mb-1">
                             <p className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Cuenta</p>
                             <PlanBadge user={user} />
                        </div>
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
        
        <main className="flex-1 overflow-y-auto bg-background dark:bg-dark-background relative pb-36 lg:pb-0">
          {children}
          
          {/* Floating Assistant Widget - Accessible on all pages */}
          <QuickTaskFab user={user} />
        </main>
      </div>

       {/* Mobile Bottom Navigation */}
       <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-surface/95 dark:bg-dark-surface/95 backdrop-blur-lg border-t border-border dark:border-dark-border flex justify-between px-2 items-center lg:hidden z-20 pb-safe">
            {navItems.map(item => <NavItem key={item.id} {...item} activePage={activePage} setActivePage={setActivePage} isMobile={true} />)}
       </nav>
    </div>
  );
};

export default Layout;
