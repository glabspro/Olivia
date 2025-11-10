import React, { useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import Logo from '../components/Logo';
import Spinner from '../components/Spinner';

interface CompleteProfilePageProps {
  user: SupabaseUser;
  onProfileUpdated: () => void;
}

const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({ user, onProfileUpdated }) => {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !companyName) {
      setError('Ambos campos son obligatorios.');
      return;
    }
    setLoading(true);

    try {
        if (!supabase) throw new Error("Cliente de Supabase no inicializado.");

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                company_name: companyName,
                // Supabase trigger will have already created the row with the ID.
                // We are just updating the empty fields.
            })
            .eq('id', user.id);

        if (error) throw error;
        onProfileUpdated(); // Signal to App.tsx to refetch profile and proceed

    } catch (err: any) {
        console.error("Error al actualizar el perfil:", err);
        setError(err.message || 'No se pudo guardar tu información. Intenta de nuevo.');
        setLoading(false);
    }
  };

  const inputBaseClasses = "w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none text-textPrimary dark:text-dark-textPrimary text-base transition-shadow shadow-sm";
  const labelClasses = "block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2";

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-dark-background p-4">
      {loading && <Spinner message="Guardando tu perfil..." />}
      <div className="w-full max-w-md bg-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-border dark:border-dark-border">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary mb-2">¡Un último paso!</h1>
        <p className="text-textSecondary dark:text-dark-textSecondary mb-6">
          Completa tu perfil para personalizar tu experiencia en Olivia.
        </p>
        
        <form className="space-y-6" onSubmit={handleUpdateProfile}>
          <div>
            <label htmlFor="email" className={labelClasses}>Correo Electrónico</label>
            <input 
              id="email" 
              type="email" 
              value={user.email || ''} 
              disabled 
              className={`${inputBaseClasses} bg-gray-100 dark:bg-dark-background cursor-not-allowed`}
            />
          </div>
          <div>
            <label htmlFor="fullName" className={labelClasses}>Nombre completo</label>
            <input 
              id="fullName" 
              type="text" 
              placeholder="Ej: Ana García" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className={inputBaseClasses} 
              required 
            />
          </div>
          <div>
            <label htmlFor="companyName" className={labelClasses}>Nombre de tu empresa</label>
            <input 
              id="companyName" 
              type="text" 
              placeholder="Ej: Proyectos Innovadores S.A.C." 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              className={inputBaseClasses} 
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300">
            Guardar y Continuar
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{error}</p>}
      </div>
    </div>
  );
};

export default CompleteProfilePage;
