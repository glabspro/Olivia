
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import Auth from './components/Auth';
import Layout from './components/Dashboard';
import NewQuotePage from './pages/NewQuotePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import OnboardingPage from './pages/OnboardingPage';
import TasksPage from './pages/TasksPage';
import AdminPage from './pages/AdminPage';
import { supabase, getProfile, getUserByPhone } from './services/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'clients' | 'products' | 'settings' | 'admin' | 'tasks'>('history');

  // CRM State: Quote Editing / Duplicating
  const [quoteIdToEdit, setQuoteIdToEdit] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const fetchAndSetProfile = async (supabaseUser: SupabaseUser) => {
    const profileData = await getProfile(supabaseUser);
    setProfile(profileData);
    return profileData;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('olivia_theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? Theme.DARK : Theme.LIGHT));

    // --- GOD MODE CHECK (Super Admin Backdoor) ---
    const isGodMode = localStorage.getItem('olivia_god_mode');
    if (isGodMode === 'true') {
        const godUser: User = {
            id: 'god-mode-admin',
            fullName: 'Super Admin',
            companyName: 'Olivia HQ',
            phone: '999999999',
            is_admin: true,
            is_onboarded: true,
            permissions: { can_use_ai: true, can_download_pdf: true, plan: 'enterprise', is_active: true },
            is_verified: true
        };
        setProfile(godUser);
        setSession({ access_token: 'god-mode-token' } as any);
        setLoading(false);
        return;
    }
    // --------------------------------------------

    if (!supabase) {
        setLoading(false);
        return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setSession(session);
            if (session?.user) {
                fetchAndSetProfile(session.user).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        } else {
            // Check simulated session
            const savedProfile = localStorage.getItem('olivia_simulated_profile');
            if(savedProfile) {
                const parsedUser = JSON.parse(savedProfile);
                // 1. Load local cache immediately for speed
                setProfile(parsedUser);
                setSession({ access_token: 'simulated' } as any);
                
                // 2. Background Sync: Fetch latest data from Cloud (Supabase) to get settings updates from other devices
                if (parsedUser.phone) {
                    getUserByPhone(parsedUser.phone).then(freshUser => {
                        if (freshUser) {
                            console.log("Perfil sincronizado con la nube");
                            setProfile(freshUser);
                            localStorage.setItem('olivia_simulated_profile', JSON.stringify(freshUser));
                        }
                    }).catch(err => console.error("Error syncing profile", err));
                }
            }
            setLoading(false);
        }
    });

  }, []);

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('olivia_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('olivia_theme', 'light');
    }
  }, [theme]);

  const handleLogout = () => {
    if (supabase) supabase.auth.signOut();
    localStorage.removeItem('olivia_simulated_profile');
    localStorage.removeItem('olivia_god_mode'); // Clear admin mode if active
    setSession(null);
    setProfile(null);
    setActivePage('history');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  // Navigation Handlers
  const handleEditQuote = (id: string) => {
      setQuoteIdToEdit(id);
      setIsDuplicating(false);
      setActivePage('new_quote');
  };

  const handleDuplicateQuote = (id: string) => {
      setQuoteIdToEdit(id);
      setIsDuplicating(true);
      setActivePage('new_quote');
  };

  const clearEditState = () => {
      setQuoteIdToEdit(null);
      setIsDuplicating(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background dark:bg-dark-background"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div></div>;

  if (!profile) {
    return <Auth onLogin={(user) => { 
        setProfile(user); 
        setSession({ access_token: 'simulated' } as any);
        // Persist simulated login for refresh
        localStorage.setItem('olivia_simulated_profile', JSON.stringify(user));
    }} />;
  }

  return (
    <Layout 
        user={profile} 
        onLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme}
        activePage={activePage}
        setActivePage={setActivePage}
    >
      {activePage === 'new_quote' && (
        <NewQuotePage 
            user={profile} 
            quoteIdToEdit={quoteIdToEdit} 
            isDuplicating={isDuplicating}
            clearEditState={clearEditState}
        />
      )}
      {activePage === 'history' && (
        <HistoryPage 
            user={profile} 
            onEditQuote={handleEditQuote}
            onDuplicateQuote={handleDuplicateQuote}
        />
      )}
      {activePage === 'settings' && <SettingsPage user={profile} />}
      {activePage === 'clients' && <ClientsPage user={profile} />}
      {activePage === 'products' && <ProductsPage user={profile} />}
      {activePage === 'tasks' && <TasksPage user={profile} />}
      {activePage === 'admin' && <AdminPage currentUser={profile} />}
      
      {/* Onboarding Overlay */}
      {!profile.is_onboarded && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-background dark:bg-dark-background">
              <OnboardingPage 
                user={profile} 
                onComplete={async () => {
                    // Refresh profile to get updated is_onboarded status
                    if (session?.user) {
                        const updated = await getProfile(session.user);
                        if(updated) setProfile(updated);
                    } else {
                        // Update local state for simulated user
                        // Fetch fresh from DB to ensure settings are captured
                        const freshUser = await getUserByPhone(profile.phone);
                        if (freshUser) {
                            setProfile(freshUser);
                            localStorage.setItem('olivia_simulated_profile', JSON.stringify(freshUser));
                        } else {
                            setProfile({ ...profile, is_onboarded: true });
                        }
                    }
                }} 
              />
          </div>
      )}
    </Layout>
  );
};

export default App;
