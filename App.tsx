import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import Auth from './components/Auth';
import Layout from './components/Dashboard';
import NewQuotePage from './pages/NewQuotePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import { supabase, getProfile } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'settings'>('new_quote');

  useEffect(() => {
    // Check for existing theme preference
    const savedTheme = localStorage.getItem('olivia_theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? Theme.DARK : Theme.LIGHT));
  }, []);

  useEffect(() => {
    // Apply theme to the document
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('olivia_theme', Theme.DARK);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('olivia_theme', Theme.LIGHT);
    }
  }, [theme]);

  useEffect(() => {
    // Return early if supabase is not configured
    if (!supabase) {
        setLoading(false);
        return;
    }

    // Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      setSession(session);
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setSession(session);
        }
        setLoading(false);
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, []);


  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };
  
  const handleAdminLogin = () => {
    console.log("Admin login bypass activated.");
    const adminUser: User = {
      id: 'admin-user-local',
      fullName: 'Administrador del Sistema',
      companyName: 'Olivia SaaS HQ',
      phone: '51944894541',
      is_admin: true,
    };
    setUser(adminUser);
    // Create a mock session object to satisfy the condition for rendering the layout
    setSession({
        access_token: 'admin-local-token',
        token_type: 'bearer',
        user: {
            id: 'admin-user-local',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        },
    } as any);
    setLoading(false);
  };

  const handleLogout = async () => {
    // Handle local admin logout
    if (user?.is_admin && user.id === 'admin-user-local') {
        setUser(null);
        setSession(null);
        setActivePage('new_quote');
        return;
    }
    // Handle Supabase user logout
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setActivePage('new_quote');
  };

  const renderActivePage = () => {
    if (!user) return null; // Should not happen if layout is rendered
    switch (activePage) {
      case 'new_quote':
        return <NewQuotePage user={user} />;
      case 'settings':
        return <SettingsPage user={user} />;
      case 'history':
        return <HistoryPage />;
      default:
        return <NewQuotePage user={user} />;
    }
  };

  if (loading) {
    return <Spinner message="Cargando tu espacio de trabajo..." />;
  }
  
  if (!supabase) {
    return <ConfigurationError />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary font-sans">
      {session && user ? (
        <Layout 
          user={user} 
          onLogout={handleLogout} 
          theme={theme} 
          toggleTheme={toggleTheme}
          activePage={activePage}
          setActivePage={setActivePage}
        >
          {renderActivePage()}
        </Layout>
      ) : (
        <Auth onAdminLogin={handleAdminLogin} />
      )}
    </div>
  );
};

export default App;