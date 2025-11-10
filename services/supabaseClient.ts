import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

// -----------------------------------------------------------------------------
// ¡IMPORTANTE! Reemplaza estos valores con las credenciales de tu proyecto de Supabase.
// Las encuentras en "Project Settings" > "API".
// -----------------------------------------------------------------------------
const supabaseUrl = 'https://fttmmnkmlefliqbhvljp.supabase.co'; // ej: https://tuidaleatorio.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dG1tbmttbGVmbGlxYmh2bGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTQ4NjAsImV4cCI6MjA3ODM3MDg2MH0.oWDSOq-sMl1nI7yQ1sc2L2ynLQHQcZQl0w47tolXYmI'; // La clave pública (anon)

// Esta función comprueba si las credenciales son válidas y no marcadores de posición
const areCredentialsValid = (url?: string, key?: string): boolean => {
    if (!url || url === 'YOUR_SUPABASE_URL' || !key || key === 'YOUR_supabase_ANON_KEY') {
        return false;
    }
    return url.startsWith('http');
};

// Crea condicionalmente el cliente de Supabase para evitar errores en el arranque
const createSupabaseClient = (): SupabaseClient | null => {
    if (areCredentialsValid(supabaseUrl, supabaseAnonKey)) {
        try {
            return createClient(supabaseUrl, supabaseAnonKey);
        } catch (error) {
            console.error("Error creating Supabase client:", error);
            return null;
        }
    }
    console.warn("Advertencia: Las credenciales de Supabase no están configuradas. Por favor, edita services/supabaseClient.ts");
    return null;
};

export const supabase = createSupabaseClient();

export const getProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabase) {
        console.error("El cliente de Supabase no está inicializado. No se puede obtener el perfil.");
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, phone, is_admin')
        .eq('id', supabaseUser.id)
        .single();

    // If there's an error and the user just signed up, a profile might not exist yet.
    // We can return a partial profile based on the auth user data.
    if (error && error.code === 'PGRST116') { // "PGRST116": "Searched for a single row, but found 0 rows"
      console.warn("Profile not found for new user, returning partial profile.");
      return {
        id: supabaseUser.id,
        fullName: '', // Will be filled in by CompleteProfilePage
        companyName: '', // Will be filled in by CompleteProfilePage
        phone: supabaseUser.phone || '',
        email: supabaseUser.email,
      };
    }
    
    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    return {
        id: data.id,
        fullName: data.full_name,
        companyName: data.company_name,
        phone: data.phone || supabaseUser.phone || '',
        is_admin: data.is_admin,
        email: supabaseUser.email,
    };
};
