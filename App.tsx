
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
import AdminPage from './pages/AdminPage';
import { supabase, getProfile } from './services/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'clients' | 'products' | 'settings' | 'admin'>('history');

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
                setProfile(JSON.parse(savedProfile));
                setSession({ access_token: 'simulated' } as any);
            }
            setLoading(false);
        }
    });

  }, []);

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('olivia_theme', Theme.DARK);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('olivia_theme', Theme.LIGHT);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  const handleLogout = async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem('olivia_simulated_profile');
    localStorage.removeItem('olivia_god_mode'); // Clear God Mode flag
    setProfile(null);
    setSession(null);
    setActivePage('history');
  };

  const handleLogin = (user: User) => {
      localStorage.setItem('olivia_simulated_profile', JSON.stringify(user));
      
      const simulatedSession: Session = {
          access_token: 'simulated-token',
          refresh_token: 'simulated-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
              id: user.id,
              aud: 'authenticated',
              role: 'authenticated',
              email: user.email,
              phone: user.phone,
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
          } as SupabaseUser
      };

      setSession(simulatedSession);
      setProfile(user);
  };
  
  const handleOnboardingComplete = () => {
      if (profile) {
          const updatedProfile = { ...profile, is_onboarded: true };
          setProfile(updatedProfile);
          // Update local storage if it was a simulated login
          if (localStorage.getItem('olivia_simulated_profile')) {
              localStorage.setItem('olivia_simulated_profile', JSON.stringify(updatedProfile));
          }
      }
  };

  // Handlers for CRM actions
  const handleEditQuote = (id: string) => {
      setQuoteIdToEdit(id);
      setIsDuplicating(false);
      setActivePage('new_quote');
  };

  const handleDuplicateQuote = (id: string) => {
      setQuoteIdToEdit(id);
      setIsDuplicating(true); // Flag to treat as new insert
      setActivePage('new_quote');
  };

  const renderActivePage = () => {
    if (!profile) return null;
    switch (activePage) {
      case 'new_quote':
        return (
            <NewQuotePage 
                user={profile} 
                quoteIdToEdit={quoteIdToEdit}
                isDuplicating={isDuplicating}
                clearEditState={() => { setQuoteIdToEdit(null); setIsDuplicating(false); }}
            />
        );
      case 'history':
        return (
            <HistoryPage 
                user={profile} 
                onEditQuote={handleEditClick => handleEditQuote(handleEditClick)}
                onDuplicateQuote={handleDuplicateQuote}
            />
        );
      case 'clients':
        return <ClientsPage user={profile} />;
      case 'products':
        return <ProductsPage user={profile} />;
      case 'settings':
        return <SettingsPage user={profile} />;
      case 'admin':
        return <AdminPage currentUser={profile} />;
      default:
        return <HistoryPage user={profile} />;
    }
  };

  if (loading) {
    return <Spinner message="Cargando tu espacio de trabajo..." />;
  }
  
  if (session && profile) {
      // Check Permissions Block
      if (profile.permissions && profile.permissions.is_active === false) {
          return (
              <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                  <h1 className="text-3xl font-bold text-red-600 mb-2">Acceso Restringido</h1>
                  <p className="text-gray-600">Tu cuenta ha sido desactivada por un administrador.</p>
                  <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Cerrar Sesión</button>
              </div>
          )
      }

      // Show Onboarding if not completed
      if (profile.is_onboarded === false) {
          return <OnboardingPage user={profile} onComplete={handleOnboardingComplete} />;
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
          {renderActivePage()}
        </Layout>
      );
  }

  return <Auth onLogin={handleLogin} />;
};

export default App;
