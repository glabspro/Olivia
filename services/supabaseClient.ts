
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, QuotationItem, SavedQuotation, DbClient, DbProduct } from '../types';

// -----------------------------------------------------------------------------
// ¡IMPORTANTE! Reemplaza estos valores con las credenciales de tu proyecto de Supabase.
// Las encuentras en "Project Settings" > "API".
// -----------------------------------------------------------------------------
const supabaseUrl = 'https://qxiaxenvmpwqepoqavyv.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aWF4ZW52bXB3cWVwb3Fhdnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjA0ODEsImV4cCI6MjA3OTEzNjQ4MX0.ghRijgSOw52jzu-egMOyHGX51odtCK_m6XZABlz24sA';

// URL del Webhook de n8n para registro de nuevos usuarios
const N8N_REGISTRATION_WEBHOOK = 'https://webhook.red51.site/webhook/new-user-olivia';

const areCredentialsValid = (url?: string, key?: string): boolean => {
    if (!url || url === 'YOUR_SUPABASE_URL' || !key || key === 'YOUR_supabase_ANON_KEY') {
        return false;
    }
    return url.startsWith('http');
};

const createSupabaseClient = (): SupabaseClient | null => {
    if (areCredentialsValid(supabaseUrl, supabaseAnonKey)) {
        try {
            return createClient(supabaseUrl, supabaseAnonKey);
        } catch (error) {
            console.error("Error creating Supabase client:", error);
            return null;
        }
    }
    return null;
};

export const supabase = createSupabaseClient();

// --- Helper: Seed Initial Data for Onboarding ---
const seedInitialData = async (userId: string) => {
    if (!supabase) return;
    
    try {
        // Insert default products
        await supabase.from('products').insert([
            { user_id: userId, name: 'Servicio de Consultoría', unit_price: 100.00, currency: 'S/' },
            { user_id: userId, name: 'Producto Ejemplo (Premium)', unit_price: 250.00, currency: 'S/' }
        ]);
        
        // Insert default client
        await supabase.from('clients').insert([
            { user_id: userId, name: 'Cliente de Prueba', phone: '999999999', email: 'cliente@ejemplo.com' }
        ]);
    } catch (e) {
        console.warn("Initial data seeding failed (non-critical):", e);
    }
}

// --- User & Auth Functions ---

export const getUserByPhone = async (phone: string): Promise<User | null> => {
    if (!supabase) return null;

    // Normalizamos el teléfono (solo números)
    const cleanPhone = phone.replace(/\D/g, '');

    // Buscamos en la tabla profiles directamente
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

    if (error) {
        if(error.message.includes('does not exist')) {
             console.error("CRITICAL ERROR: The 'profiles' table does not exist in Supabase. Please run the SQL setup script.");
        } else {
             console.error("Error checking user:", error);
        }
        return null;
    }

    if (data) {
        return {
            id: data.id,
            fullName: data.full_name,
            companyName: data.company_name,
            phone: data.phone,
            is_admin: data.is_admin,
            email: data.email
        };
    }

    return null;
};

export const registerNewUser = async (userData: { fullName: string, companyName: string, phone: string }): Promise<User> => {
    if (!supabase) throw new Error("Supabase not configured");
    
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const newId = crypto.randomUUID(); // Generamos un ID único manualmente

    // 1. Guardar en Supabase
    const { error } = await supabase
        .from('profiles')
        .insert({
            id: newId,
            full_name: userData.fullName,
            company_name: userData.companyName,
            phone: cleanPhone,
            is_admin: false
        });

    if (error) {
        // Si el error es por duplicado (código 23505 en Postgres), asumimos que ya existe y lo devolvemos
        // Esto hace el registro "idempotente" y evita errores si el usuario da doble click
        if (error.code === '23505' || error.message.includes('unique constraint')) {
            console.log("Usuario ya existe, procediendo a login...");
            const existingUser = await getUserByPhone(cleanPhone);
            if (existingUser) return existingUser;
        }
        throw new Error(`Error creando perfil: ${error.message}`);
    }
    
    // 2. Seed Initial Data (Non-blocking but awaited for better UX on first load)
    await seedInitialData(newId);

    // 3. Notificar a n8n (Disparar Webhook de Bienvenida)
    try {
        // Enviamos los datos al Webhook para procesar con Evolution API
        fetch(N8N_REGISTRATION_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userData.fullName,
                phone: cleanPhone,
                business_name: userData.companyName,
                event: 'new_registration',
                date: new Date().toISOString()
            })
        }).catch(err => console.error("Error notificando a n8n (silencioso):", err));
    } catch (e) {
        console.error("Error trigger webhook:", e);
    }

    return {
        id: newId,
        fullName: userData.fullName,
        companyName: userData.companyName,
        phone: cleanPhone,
        is_admin: false
    };
};

export const getProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, phone, is_admin')
        .eq('id', supabaseUser.id)
        .single();

    if (error) return null;

    return {
        id: data.id,
        fullName: data.full_name,
        companyName: data.company_name,
        phone: data.phone || supabaseUser.phone || '',
        is_admin: data.is_admin,
        email: supabaseUser.email,
    };
};

// --- Database Functions ---

export const saveQuotation = async (
    userId: string,
    clientData: { name: string; phone: string; email?: string },
    quoteData: { number: string; total: number; currency: string; items: QuotationItem[] }
) => {
    if (!supabase) throw new Error("Supabase no configurado");

    let clientId: string;

    const { data: existingClient, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('name', clientData.name)
        .maybeSingle();

    if (existingClient) {
        clientId = existingClient.id;
    } else {
        const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name: clientData.name,
                phone: clientData.phone,
                email: clientData.email
            })
            .select('id')
            .single();
        
        if (clientError) throw new Error(`Error creando cliente: ${clientError.message}`);
        clientId = newClient.id;
    }

    const { data: newQuote, error: quoteError } = await supabase
        .from('quotations')
        .insert({
            user_id: userId,
            client_id: clientId,
            quotation_number: quoteData.number,
            total_amount: quoteData.total,
            currency: quoteData.currency,
            status: 'sent'
        })
        .select('id')
        .single();

    if (quoteError) throw new Error(`Error guardando cotización: ${quoteError.message}`);

    const itemsToInsert = quoteData.items.map(item => ({
        quotation_id: newQuote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice 
    }));

    const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

    if (itemsError) throw new Error(`Error guardando items: ${itemsError.message}`);

    const productsToUpsert = quoteData.items.map(item => ({
        user_id: userId,
        name: item.description,
        unit_price: item.unitPrice,
        currency: quoteData.currency
    }));

    const { error: productsError } = await supabase
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'user_id, name' });

    if (productsError) console.warn("Error actualizando catálogo:", productsError);

    return newQuote.id;
};

export const getQuotations = async (userId: string): Promise<SavedQuotation[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            id,
            quotation_number,
            total_amount,
            currency,
            status,
            created_at,
            clients (
                id,
                name,
                phone,
                email
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching quotations:", error);
        return [];
    }

    return data.map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number,
        total_amount: q.total_amount,
        currency: q.currency,
        status: q.status,
        created_at: q.created_at,
        client: {
            id: q.clients?.id,
            name: q.clients?.name || 'Cliente Desconocido',
            phone: q.clients?.phone,
            email: q.clients?.email
        }
    }));
};

// --- Client Management Functions ---

export const getClients = async (userId: string): Promise<DbClient[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
    
    if (error) return [];
    return data || [];
}

export const saveClient = async (userId: string, client: Omit<DbClient, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    
    let error;
    if (client.id) {
        const { error: updateError } = await supabase
            .from('clients')
            .update({
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address
            })
            .eq('id', client.id)
            .eq('user_id', userId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address
            });
        error = insertError;
    }

    if (error) throw new Error(error.message);
}

export const deleteClient = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// --- Product Management Functions ---

export const getProducts = async (userId: string): Promise<DbProduct[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
    
    if (error) return [];
    return data || [];
}

export const saveProduct = async (userId: string, product: Omit<DbProduct, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    
    let error;
    if (product.id) {
        const { error: updateError } = await supabase
            .from('products')
            .update({
                name: product.name,
                unit_price: product.unit_price,
                currency: product.currency
            })
            .eq('id', product.id)
            .eq('user_id', userId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('products')
            .insert({
                user_id: userId,
                name: product.name,
                unit_price: product.unit_price,
                currency: product.currency
            });
        error = insertError;
    }

    if (error) throw new Error(error.message);
}

export const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
