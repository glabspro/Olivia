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

const ConfigurationError = () => (
    <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800 p-4">
        <div className="text-center max-w-2xl bg-white border border-red-200 p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Error de Configuración de Supabase</h1>
            <p className="mb-4">La aplicación no pudo conectarse a la base de datos porque las credenciales no están configuradas.</p>
            <div className="text-sm text-left bg-gray-100 p-4 rounded-md">
                <p>Por favor, abre el archivo <code className="font-mono bg-red-100 text-red-900 px-1 py-0.5 rounded">services/supabaseClient.ts</code> y reemplaza los valores de:</p>
                <ul className="list-disc list-inside mt-2">
                    <li><code className="font-mono bg-red-100 text-red-900 px-1 py-0.5 rounded">YOUR_SUPABASE_URL</code></li>
                    <li><code className="font-mono bg-red-100 text-red-900 px-1 py-0.5 rounded">YOUR_SUPABASE_ANON_KEY</code></li>
                </ul>
                <p className="mt-2">Puedes encontrar estas credenciales en la configuración de tu proyecto de Supabase, en la sección "API".</p>
            </div>
        </div>
    </div>
);

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
        setSession(session);
        if (session?.user) {
            fetchAndSetProfile(session.user).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        await fetchAndSetProfile(session.user);
        setLoading(false);
      } else {
        setProfile(null);
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
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setActivePage('new_quote');
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
  
  if (!supabase) {
    return <ConfigurationError />;
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
  return <Auth />;
};

export default App;
