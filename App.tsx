
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import Auth from './components/Auth';
import Layout from './components/Dashboard';
import NewQuotePage from './pages/NewQuotePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import { supabase, getProfile } from './services/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'settings'>('new_quote');

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

    supabase.auth.getSession().then(({ data: { session } }) => {
        // Only set session if it exists and we haven't manually set a simulated one
        if (session) {
            setSession(session);
            if (session?.user) {
                fetchAndSetProfile(session.user).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // If we are simulating, we might want to ignore null session updates from supabase
      // But for now, standard behavior
      if (session) {
        setSession(session);
        setLoading(true);
        await fetchAndSetProfile(session.user);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
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
    setProfile(null);
    setSession(null);
    setActivePage('new_quote');
  };

  const handleSimulatedLogin = (phone: string) => {
      const simulatedUser: User = {
          id: `simulated-user-${phone}`,
          fullName: 'Usuario Demo',
          companyName: 'Mi Empresa S.A.C.',
          phone: phone,
          email: 'demo@olivia.com',
          is_admin: false
      };

      // Construct a minimal simulated session object
      const simulatedSession: Session = {
          access_token: 'simulated-token',
          refresh_token: 'simulated-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
              id: simulatedUser.id,
              aud: 'authenticated',
              role: 'authenticated',
              email: simulatedUser.email,
              phone: simulatedUser.phone,
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
          } as SupabaseUser
      };

      setSession(simulatedSession);
      setProfile(simulatedUser);
  };

  const renderActivePage = () => {
    if (!profile) return null;
    switch (activePage) {
      case 'new_quote':
        return <NewQuotePage user={profile} />;
      case 'settings':
        return <SettingsPage user={profile} />;
      case 'history':
        return <HistoryPage />;
      default:
        return <NewQuotePage user={profile} />;
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

  // If no session, show Auth page with simulated login callback
  return <Auth onLogin={handleSimulatedLogin} />;
};

export default App;
