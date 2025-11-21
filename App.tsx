
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
import { supabase, getProfile } from './services/supabaseClient';
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
      localStorage.setItem('olivia_theme