import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import Auth from './components/Auth';
import Layout from './components/Dashboard';
import NewQuotePage from './pages/NewQuotePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [activePage, setActivePage] = useState<'new_quote' | 'history' | 'settings'>('new_quote');

  useEffect(() => {
    const savedTheme = localStorage.getItem('olivia_theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme(Theme.DARK);
    }
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

  const handleLogin = (companyName: string, phone: string) => {
    setUser({
      id: `user-${Date.now()}`,
      companyName: companyName,
      phone: phone,
    });
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('new_quote');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'new_quote':
        return <NewQuotePage user={user!} />;
      case 'settings':
        return <SettingsPage user={user!} />;
      case 'history':
        return <HistoryPage />;
      default:
        return <NewQuotePage user={user!} />;
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-textPrimary dark:text-dark-textPrimary font-sans">
      {user ? (
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
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;