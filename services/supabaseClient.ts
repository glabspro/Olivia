
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, QuotationItem, SavedQuotation, DbClient, DbProduct } from '../types';

// -----------------------------------------------------------------------------
// ¡IMPORTANTE! Reemplaza estos valores con las credenciales de tu proyecto de Supabase.
// Las encuentras en "Project Settings" > "API".
// -----------------------------------------------------------------------------
const supabaseUrl = 'https://qxiaxenvmpwqepoqavyv.supabase.co'; // Updated URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aWF4ZW52bXB3cWVwb3Fhdnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjA0ODEsImV4cCI6MjA3OTEzNjQ4MX0.ghRijgSOw52jzu-egMOyHGX51odtCK_m6XZABlz24sA'; // Updated Anon Key

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

    if (error) {
        // Log the full error object properly
        console.error("Error fetching profile:", JSON.stringify(error, null, 2));
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

// --- Database Functions ---

export const saveQuotation = async (
    userId: string,
    clientData: { name: string; phone: string; email?: string },
    quoteData: { number: string; total: number; currency: string; items: QuotationItem[] }
) => {
    if (!supabase) throw new Error("Supabase no configurado");

    // 1. Buscar o Crear Cliente
    let clientId: string;

    // Use maybeSingle() to avoid throwing error if 0 rows are found
    const { data: existingClient, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('name', clientData.name)
        .maybeSingle();

    if (searchError) {
        console.error("Error searching for client:", JSON.stringify(searchError, null, 2));
        // We continue and try to create it, or you might want to throw here depending on severity
    }

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
        
        if (clientError) throw new Error(`Error creando cliente: ${clientError.message || JSON.stringify(clientError)}`);
        clientId = newClient.id;
    }

    // 2. Crear Cotización
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

    if (quoteError) throw new Error(`Error guardando cotización: ${quoteError.message || JSON.stringify(quoteError)}`);

    // 3. Crear Items de la Cotización (Detalle)
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

    if (itemsError) throw new Error(`Error guardando items: ${itemsError.message || JSON.stringify(itemsError)}`);

    // 4. Guardar/Actualizar Catálogo de Productos (Upsert)
    const productsToUpsert = quoteData.items.map(item => ({
        user_id: userId,
        name: item.description,
        unit_price: item.unitPrice,
        currency: quoteData.currency
    }));

    const { error: productsError } = await supabase
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'user_id, name' });

    if (productsError) {
        // Log warning but don't fail the whole operation
        console.warn("Error actualizando catálogo de productos:", JSON.stringify(productsError, null, 2));
    }

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
        console.error("Error fetching quotations:", JSON.stringify(error, null, 2));
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
    
    if (error) {
        console.error("Error fetching clients:", JSON.stringify(error, null, 2));
        return [];
    }
    return data || [];
}

export const saveClient = async (userId: string, client: Omit<DbClient, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    
    let error;
    if (client.id) {
        // Update
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
        // Insert
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

    if (error) throw new Error(error.message || JSON.stringify(error));
}

export const deleteClient = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
    
    if (error) throw new Error(error.message || JSON.stringify(error));
}

// --- Product Management Functions ---

export const getProducts = async (userId: string): Promise<DbProduct[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
    
    if (error) {
        console.error("Error fetching products:", JSON.stringify(error, null, 2));
        return [];
    }
    return data || [];
}

export const saveProduct = async (userId: string, product: Omit<DbProduct, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    
    let error;
    if (product.id) {
        // Update
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
        // Insert
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

    if (error) throw new Error(error.message || JSON.stringify(error));
}

export const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    
    if (error) throw new Error(error.message || JSON.stringify(error));
}
