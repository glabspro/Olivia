// /supabase/functions/verify-whatsapp-otp/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code, fullName, companyName } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'El teléfono y el código son requeridos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Secrets de Supabase no encontrados. Asegúrate de configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
        return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    console.log(`[verify-otp] Iniciando verificación para el teléfono: ${phone}`);
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes').select('code_hash, expires_at').eq('phone', phone)
      .order('created_at', { ascending: false }).limit(1).single();

    if (otpError || !otpData) {
      console.warn(`[verify-otp] No se encontró OTP o hubo un error para ${phone}:`, otpError);
      return new Response(JSON.stringify({ error: 'Código incorrecto o no solicitado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (new Date(otpData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'El código ha expirado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const receivedCodeHash = await hashText(code);
    if (receivedCodeHash !== otpData.code_hash) {
      return new Response(JSON.stringify({ error: 'Código incorrecto.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log(`[verify-otp] Código verificado con éxito para ${phone}. Buscando/creando usuario.`);

    const phoneWithoutPlus = phone.substring(1);
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByPhone(phoneWithoutPlus);
    
    let targetUser = user;

    if (getUserError || !targetUser) {
      console.log(`[verify-otp] Usuario no encontrado para ${phone}, creando uno nuevo.`);
      const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({ phone: phoneWithoutPlus, phone_confirm: true });
      if (createUserError) {
          console.error("[verify-otp] SUPABASE CREATE USER ERROR:", createUserError);
          return new Response(JSON.stringify({ error: `No se pudo crear el usuario. Razón: ${createUserError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      targetUser = newUserData.user;
      await supabase.from('profiles').update({ full_name: fullName, company_name: companyName }).eq('id', targetUser.id);
      console.log(`[verify-otp] Nuevo usuario creado con ID: ${targetUser.id}`);
    }
    
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
        console.error("SUPABASE_JWT_SECRET no está configurado en los secretos de la función.");
        throw new Error("Configuración de autenticación incompleta.");
    }
    
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        true,
        ["sign", "verify"],
    );

    const customToken = await create({ alg: "HS256", typ: "JWT" }, { 
        sub: targetUser.id,
        phone: targetUser.phone, 
        aud: 'authenticated', 
        role: 'authenticated',
        exp: getNumericDate(60 * 60 * 24 * 7) // 7 días de validez
    }, key);
    console.log(`[verify-otp] JWT generado para el usuario ${targetUser.id}.`);

    await supabase.from('otp_codes').delete().eq('phone', phone);
    
    return new Response(JSON.stringify({
      session: { access_token: customToken, token_type: 'bearer', user: targetUser },
      user: targetUser
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("[verify-otp] FATAL ERROR:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
