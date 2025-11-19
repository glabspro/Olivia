
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import Auth from './components/Auth';
import Layout from './components/Dashboard';
import NewQuotePage from './pages/NewQuotePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import { supabase, getProfile } from './services/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'clients' | 'products' | 'settings'>('history');

  const fetchAndSetProfile = async (supabaseUser: SupabaseUser) => {
    const profileData = await getProfile(supabaseUser);
    setProfile(profileData);
    return profileData;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('olivia_theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? Theme.DARK : Theme.LIGHT));

    if (!supabase) {
        setLoading(false);
        return;
    }

    // Check existing session
    // Nota: Como estamos usando un login híbrido (simulado para simplificar pero guardando en BD), 
    // dependemos principalmente del estado local 'profile' si no hay Auth de Supabase real activo.
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setSession(session);
            if (session?.user) {
                fetchAndSetProfile(session.user).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        } else {
            // Check if we have a persisted "simulated" session in localStorage for better UX on refresh
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
    setProfile(null);
    setSession(null);
    setActivePage('history');
  };

  const handleLogin = (user: User) => {
      // Persist simple login
      localStorage.setItem('olivia_simulated_profile', JSON.stringify(user));
      
      // Create a dummy session object to satisfy the types
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

  const renderActivePage = () => {
    if (!profile) return null;
    switch (activePage) {
      case 'new_quote':
        return <NewQuotePage user={profile} />;
      case 'history':
        return <HistoryPage user={profile} />;
      case 'clients':
        return <ClientsPage user={profile} />;
      case 'products':
        return <ProductsPage user={profile} />;
      case 'settings':
        return <SettingsPage user={profile} />;
      default:
        return <HistoryPage user={profile} />;
    }
  };

  if (loading) {
    return <Spinner message="Cargando tu espacio de trabajo..." />;
  }
  
  if (session && profile) {
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

  // If no session, show Auth page
  return <Auth onLogin={handleLogin} />;
};

export default App;
