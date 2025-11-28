
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, QuotationItem, SavedQuotation, DbClient, DbProduct, UserPermissions, CrmMeta, DbTask, Settings, SystemConfig } from '../types';

const supabaseUrl = 'https://qxiaxenvmpwqepoqavyv.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aWF4ZW52bXB3cWVwb3Fhdnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjA0ODEsImV4cCI6MjA3OTEzNjQ4MX0.ghRijgSOw52jzu-egMOyHGX51odtCK_m6XZABlz24sA';
const N8N_REGISTRATION_WEBHOOK = 'https://webhook.red51.site/webhook/new-user-olivia';
const N8N_TASK_WEBHOOK = 'https://webhook.red51.site/webhook/task-created';

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

const seedInitialData = async (userId: string) => {
    if (!supabase) return;
    try {
        await supabase.from('products').insert([
            { user_id: userId, name: 'Servicio de Consultoría', unit_price: 100.00, currency: 'S/' },
            { user_id: userId, name: 'Producto Ejemplo (Premium)', unit_price: 250.00, currency: 'S/' }
        ]);
        await supabase.from('clients').insert([
            { user_id: userId, name: 'Cliente de Prueba', phone: '999999999', email: 'cliente@ejemplo.com' }
        ]);
    } catch (e) {
        console.warn("Initial data seeding failed (non-critical):", e);
    }
}

// --- Logic: Check Trial Expiration ---
const checkAndEnforcePlan = async (userProfile: any): Promise<any> => {
    if (!supabase) return userProfile;

    // Si el usuario es PRO y tiene una fecha de fin de prueba
    if (userProfile.permissions?.plan === 'pro' && userProfile.permissions?.trial_ends_at) {
        const trialEnd = new Date(userProfile.permissions.trial_ends_at);
        const now = new Date();

        // Si la fecha actual es mayor a la fecha de fin de prueba
        if (now > trialEnd) {
            console.log("Trial expired. Downgrading to Free.");
            const newPermissions: UserPermissions = {
                ...userProfile.permissions,
                plan: 'free',
                trial_ends_at: undefined // Remove trial date so we know it ended
            };

            await supabase.from('profiles').update({ permissions: newPermissions }).eq('id', userProfile.id);
            return { ...userProfile, permissions: newPermissions };
        }
    }
    return userProfile;
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
    if (!supabase) return null;

    const cleanPhone = phone.replace(/\D/g, '');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

    if (error) {
        if(error.message.includes('does not exist')) {
             console.error("CRITICAL ERROR: The 'profiles' table does not exist.");
        }
        return null;
    }

    if (data) {
        const updatedData = await checkAndEnforcePlan(data);
        // Extract system_config from settings if available (nested structure for DB persistence)
        const systemConfig = updatedData.settings?.system_config || updatedData.system_config;

        return {
            id: updatedData.id,
            fullName: updatedData.full_name,
            companyName: updatedData.company_name,
            phone: updatedData.phone,
            is_admin: updatedData.is_admin,
            email: updatedData.email,
            is_onboarded: updatedData.is_onboarded,
            permissions: updatedData.permissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true },
            is_verified: updatedData.is_verified,
            ai_usage_count: updatedData.ai_usage_count || 0,
            settings: updatedData.settings,
            system_config: systemConfig
        };
    }
    return null;
};

export const registerNewUser = async (userData: { fullName: string, companyName: string, phone: string }): Promise<{ user: User, alreadyVerified: boolean }> => {
    if (!supabase) throw new Error("Supabase not configured");
    
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const existingUser = await getUserByPhone(cleanPhone);
    if (existingUser) {
        return { user: existingUser, alreadyVerified: !!existingUser.is_verified };
    }

    const newId = crypto.randomUUID();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); 

    // *** TRIAL LOGIC: 7 Days PRO ***
    const trialDays = 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    const initialPermissions: UserPermissions = { 
        can_use_ai: true, 
        can_download_pdf: true, 
        plan: 'pro', // Start as PRO for trial
        is_active: true,
        trial_ends_at: trialEndDate.toISOString() 
    };

    const { error } = await supabase
        .from('profiles')
        .insert({
            id: newId,
            full_name: userData.fullName,
            company_name: userData.companyName,
            phone: cleanPhone,
            is_admin: false,
            is_onboarded: false,
            is_verified: false,
            verify_token: otpCode,
            permissions: initialPermissions,
            ai_usage_count: 0
        });

    if (error) throw new Error(`Error creando perfil: ${error.message}`);
    await seedInitialData(newId);

    try {
        await fetch(N8N_REGISTRATION_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userData.fullName,
                phone: cleanPhone,
                business_name: userData.companyName,
                otp: otpCode,
                event: 'verification_request',
                date: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error("Error trigger webhook:", e);
    }

    return {
        user: {
            id: newId,
            fullName: userData.fullName,
            companyName: userData.companyName,
            phone: cleanPhone,
            is_admin: false,
            is_onboarded: false,
            is_verified: false,
            permissions: initialPermissions,
            ai_usage_count: 0
        },
        alreadyVerified: false
    };
};

export const verifyUserOTP = async (userId: string, inputOtp: string): Promise<boolean> => {
    if (!supabase) return false;
    const { data, error } = await supabase.from('profiles').select('verify_token').eq('id', userId).single();
    if (error || !data) return false;
    if (data.verify_token === inputOtp) {
        await supabase.from('profiles').update({ is_verified: true, verify_token: null }).eq('id', userId);
        return true;
    }
    return false;
};

export const getProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
    if (error) return null;
    const updatedData = await checkAndEnforcePlan(data);
    
    // Extract system_config from settings if available (nested structure for DB persistence)
    const systemConfig = updatedData.settings?.system_config || updatedData.system_config;

    return {
        id: updatedData.id,
        fullName: updatedData.full_name,
        companyName: updatedData.company_name,
        phone: updatedData.phone || supabaseUser.phone || '',
        is_admin: updatedData.is_admin,
        email: supabaseUser.email,
        is_onboarded: updatedData.is_onboarded,
        permissions: updatedData.permissions,
        is_verified: updatedData.is_verified,
        ai_usage_count: updatedData.ai_usage_count || 0,
        settings: updatedData.settings,
        system_config: systemConfig
    };
};

export const updateUserSettings = async (userId: string, settings: Settings) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ settings }).eq('id', userId);
    if (error) throw error;
};

export const updateSystemConfig = async (userId: string, config: SystemConfig) => {
    if (!supabase) return;
    
    // 1. Fetch current settings to avoid partial updates destroying other data
    const { data } = await supabase.from('profiles').select('settings').eq('id', userId).single();
    const currentSettings = data?.settings || {};
    
    // 2. Nest system_config inside settings
    const newSettings = { 
        ...currentSettings, 
        system_config: config 
    };

    // 3. Save back to the 'settings' column which is JSONB and definitely exists
    const { error } = await supabase.from('profiles').update({ settings: newSettings }).eq('id', userId);
    
    if (error) {
        console.error("Error updating system config in settings:", error);
        throw error;
    }
};

export const completeOnboarding = async (userId: string) => {
    if (!supabase) return;
    await supabase.from('profiles').update({ is_onboarded: true }).eq('id', userId);
};

export const incrementAIUsage = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('ai_usage_count').eq('id', userId).single();
    const current = data?.ai_usage_count || 0;
    await supabase.from('profiles').update({ ai_usage_count: current + 1 }).eq('id', userId);
};

export const uploadQuotationPDF = async (file: File): Promise<string> => { return uploadGenericFile(file); };

export const uploadGenericFile = async (file: File): Promise<string> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('quotations').upload(fileName, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Error Storage: ${error.message}`);
    const { data } = supabase.storage.from('quotations').getPublicUrl(fileName);
    return data.publicUrl;
};

export const getAllUsers = async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((u: any) => ({
        id: u.id,
        fullName: u.full_name,
        companyName: u.company_name,
        phone: u.phone,
        email: u.email,
        is_admin: u.is_admin,
        is_onboarded: u.is_onboarded,
        permissions: u.permissions || { can_use_ai: true, can_download_pdf: true, plan: 'free', is_active: true },
        is_verified: u.is_verified,
        ai_usage_count: u.ai_usage_count || 0,
        settings: u.settings
    }));
};

export const updateUserPermissions = async (userId: string, permissions: UserPermissions) => {
    if (!supabase) return;
    const permsToSave = { ...permissions };
    if (permissions.plan === 'pro' && !permissions.trial_ends_at) { delete permsToSave.trial_ends_at; }
    const { data, error } = await supabase.from('profiles').update({ permissions: permsToSave }).eq('id', userId).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Permiso denegado: RLS.");
};

export const updateUserProfile = async (userId: string, data: { fullName: string, companyName: string, phone: string }) => {
    if (!supabase) return;
    const { data: updatedData, error } = await supabase.from('profiles').update({ full_name: data.fullName, company_name: data.companyName, phone: data.phone }).eq('id', userId).select();
    if (error) throw error;
    if (!updatedData || updatedData.length === 0) throw new Error("Permiso denegado: RLS.");
}

export const deleteUserProfile = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').delete().eq('id', userId).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Permiso denegado: RLS.");
};

export const getMonthlyQuoteCount = async (userId: string): Promise<number> => {
    if (!supabase) return 0;
    const date = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const { count, error } = await supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', firstDayOfMonth);
    if (error) return 0;
    return count || 0;
}

export const saveQuotation = async (
    userId: string,
    clientData: { name: string; phone: string; email?: string; address?: string; document?: string },
    quoteData: { number: string; total: number; currency: string; items: QuotationItem[], discount?: number, discountType?: 'amount' | 'percentage' },
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'negotiation' = 'sent',
    skipProductSave: boolean = false
) => {
    if (!supabase) throw new Error("Supabase no configurado");
    let clientId: string | null = null;
    if (clientData.document) {
        const { data: clientByDoc } = await supabase.from('clients').select('id').eq('user_id', userId).eq('document', clientData.document).maybeSingle();
        if (clientByDoc) clientId = clientByDoc.id;
    }
    if (!clientId && clientData.name) {
        const { data: clientByName } = await supabase.from('clients').select('id').eq('user_id', userId).eq('name', clientData.name).maybeSingle();
        if (clientByName) clientId = clientByName.id;
    }
    if (clientId) {
        await supabase.from('clients').update({ name: clientData.name, phone: clientData.phone, email: clientData.email, address: clientData.address, document: clientData.document }).eq('id', clientId);
    } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ user_id: userId, name: clientData.name, phone: clientData.phone, email: clientData.email, address: clientData.address, document: clientData.document }).select('id').single();
        if (clientError) throw new Error(`Error creando cliente: ${clientError.message}`);
        clientId = newClient.id;
    }
    const { data: newQuote, error: quoteError } = await supabase.from('quotations').insert({ user_id: userId, client_id: clientId, quotation_number: quoteData.number, total_amount: quoteData.total, currency: quoteData.currency, status: status, discount: quoteData.discount || 0, discount_type: quoteData.discountType || 'amount' }).select('id').single();
    if (quoteError) throw new Error(`Error guardando cotización: ${quoteError.message}`);
    const itemsToInsert = quoteData.items.map(item => ({ quotation_id: newQuote.id, description: item.description, quantity: item.quantity, unit_price: item.unitPrice, total_price: item.quantity * item.unitPrice }));
    const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert);
    if (itemsError) throw new Error(`Error guardando items: ${itemsError.message}`);
    if (!skipProductSave) {
        const productsToUpsert = quoteData.items.map(item => ({ user_id: userId, name: item.description, unit_price: item.unitPrice, currency: quoteData.currency }));
        await supabase.from('products').upsert(productsToUpsert, { onConflict: 'user_id, name' });
    }
    return newQuote.id;
};

export const updateQuotation = async (
    quotationId: string,
    clientData: { name: string; phone: string; email?: string; address?: string; document?: string },
    quoteData: { total: number; currency: string; items: QuotationItem[], discount?: number, discountType?: 'amount' | 'percentage' },
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'negotiation'
) => {
     if (!supabase) throw new Error("Supabase no configurado");
     const updateData: any = { total_amount: quoteData.total, currency: quoteData.currency, discount: quoteData.discount || 0, discount_type: quoteData.discountType || 'amount' };
     if (status) updateData.status = status;
     const { error: headerError } = await supabase.from('quotations').update(updateData).eq('id', quotationId);
     if (headerError) throw new Error(headerError.message);
     await supabase.from('quotation_items').delete().eq('quotation_id', quotationId);
     const itemsToInsert = quoteData.items.map(item => ({ quotation_id: quotationId, description: item.description, quantity: item.quantity, unit_price: item.unitPrice, total_price: item.quantity * item.unitPrice }));
    const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert);
    if (itemsError) throw new Error(itemsError.message);
}

export const updateQuotationStatus = async (quotationId: string, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('quotations').update({ status }).eq('id', quotationId);
    if (error) throw error;
};

export const updateQuotationTags = async (quotationId: string, tags: string[], meta?: CrmMeta) => {
    if (!supabase) return;
    const updateData: any = { tags };
    if (meta) { updateData.crm_meta = meta; }
    const { error } = await supabase.from('quotations').update(updateData).eq('id', quotationId);
    if (error) throw error;
};

export const deleteQuotation = async (quotationId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('quotations').delete().eq('id', quotationId);
    if (error) throw error;
};

export const getQuotations = async (userId: string): Promise<SavedQuotation[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('quotations').select(`id, quotation_number, total_amount, currency, status, created_at, discount, discount_type, tags, crm_meta, clients (id, name, phone, email, address, document), quotation_items (description)`).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number,
        total_amount: q.total_amount,
        currency: q.currency,
        status: q.status,
        created_at: q.created_at,
        discount: q.discount || 0,
        discount_type: q.discount_type || 'amount',
        tags: q.tags || [],
        crm_meta: q.crm_meta || {},
        client: { id: q.clients?.id, name: q.clients?.name || 'Cliente Desconocido', phone: q.clients?.phone, email: q.clients?.email, address: q.clients?.address, document: q.clients?.document },
        items: q.quotation_items?.map((i: any) => ({ description: i.description }))
    }));
};

export const getClientQuotations = async (clientId: string): Promise<SavedQuotation[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('quotations').select(`id, quotation_number, total_amount, currency, status, created_at, tags, quotation_items (description)`).eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number,
        total_amount: q.total_amount,
        currency: q.currency,
        status: q.status,
        created_at: q.created_at,
        tags: q.tags || [],
        client: { id: clientId, name: '', phone: '' }, 
        items: q.quotation_items?.map((i: any) => ({ description: i.description }))
    }));
};

export const getQuotationById = async (quotationId: string) => {
    if (!supabase) return null;
    const { data: quote, error } = await supabase.from('quotations').select(`*, clients (*), quotation_items (*)`).eq('id', quotationId).single();
    if (error || !quote) return null;
    return {
        id: quote.id,
        number: quote.quotation_number,
        client: quote.clients,
        items: quote.quotation_items.map((i: any) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unit_price })),
        discount: quote.discount || 0,
        discountType: quote.discount_type || 'amount',
        total: quote.total_amount,
        currency: quote.currency,
        status: quote.status
    };
};

export const getTasks = async (userId: string): Promise<DbTask[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('is_important', { ascending: false }).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
}

export const getPendingTaskCount = async (userId: string): Promise<number> => {
    if (!supabase) return 0;
    const { count, error } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_completed', false);
    if (error) return 0;
    return count || 0;
}

export const triggerTaskAutomation = async (user: User, taskData: { type: string, description: string, date?: string, email?: string, phone?: string, name?: string }) => {
    try {
        const payload = { user_phone: user.phone.replace(/\D/g, ''), user_name: user.fullName, description: taskData.description, cal_link: user.settings?.calComLink || '', date: taskData.date || new Date().toISOString(), type: taskData.type, client_email: taskData.email || '', client_phone: taskData.phone || '', client_name: taskData.name || '' };
        fetch(N8N_TASK_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(err => console.error("Error triggering n8n task webhook:", err));
    } catch (e) { console.error("Error building task payload:", e); }
}

export const createTask = async (userId: string, description: string, dueDate?: string, isImportant: boolean = false) => {
    if (!supabase) throw new Error("Supabase not ready");
    const { error } = await supabase.from('tasks').insert({ user_id: userId, description, due_date: dueDate, is_important: isImportant });
    if (error) throw error;
}

export const updateTask = async (taskId: string, description: string, dueDate?: string) => {
    if (!supabase) throw new Error("Supabase not ready");
    const { error } = await supabase.from('tasks').update({ description, due_date: dueDate, reminder_sent: false }).eq('id', taskId);
    if (error) throw error;
}

export const updateTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    if (!supabase) throw new Error("Supabase not ready");
    const { error } = await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', taskId);
    if (error) throw error;
}

export const updateTaskImportance = async (taskId: string, isImportant: boolean) => {
    if (!supabase) throw new Error("Supabase not ready");
    const { error } = await supabase.from('tasks').update({ is_important: isImportant }).eq('id', taskId);
    if (error) throw error;
}

export const deleteTask = async (taskId: string) => {
    if (!supabase) throw new Error("Supabase not ready");
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
}

export const getClients = async (userId: string): Promise<DbClient[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).order('name', { ascending: true });
    if (error) return [];
    return data || [];
}

export const saveClient = async (userId: string, client: Omit<DbClient, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    let error;
    if (client.id) {
        const { error: updateError } = await supabase.from('clients').update({ name: client.name, phone: client.phone, email: client.email, address: client.address, document: client.document }).eq('id', client.id).eq('user_id', userId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('clients').insert({ user_id: userId, name: client.name, phone: client.phone, email: client.email, address: client.address, document: client.document });
        error = insertError;
    }
    if (error) throw new Error(error.message);
}

export const deleteClient = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const getProducts = async (userId: string): Promise<DbProduct[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('name', { ascending: true });
    if (error) return [];
    return data || [];
}

export const saveProduct = async (userId: string, product: Omit<DbProduct, 'id'> & { id?: string }) => {
    if (!supabase) throw new Error("No Supabase client");
    let error;
    if (product.id) {
        const { error: updateError } = await supabase.from('products').update({ name: product.name, unit_price: product.unit_price, currency: product.currency }).eq('id', product.id).eq('user_id', userId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('products').insert({ user_id: userId, name: product.name, unit_price: product.unit_price, currency: product.currency });
        error = insertError;
    }
    if (error) throw new Error(error.message);
}

export const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error("No Supabase client");
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
}