// /supabase/functions/verify-whatsapp-otp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.159.0/crypto/mod.ts";
import { sign } from 'https://deno.land/x/djwt@v2.2/mod.ts'

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
  // Manejo de la petición pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code, fullName, companyName } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'El teléfono y el código son requeridos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes').select('code_hash, expires_at').eq('phone', phone)
      .order('created_at', { ascending: false }).limit(1).single();

    if (otpError || !otpData) {
      return new Response(JSON.stringify({ error: 'Código incorrecto o no solicitado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (new Date(otpData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'El código ha expirado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const receivedCodeHash = await hashText(code);
    if (receivedCodeHash !== otpData.code_hash) {
      return new Response(JSON.stringify({ error: 'Código incorrecto.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByPhone(phone.substring(1));
    
    let targetUser = user;

    if (getUserError || !targetUser) {
      // FIX: The createUser function requires the phone number WITHOUT the leading '+'.
      // The `phone` variable from the request body is in E.164 format (e.g., "+51...").
      const phoneForCreate = phone.substring(1);
      
      const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({ phone: phoneForCreate, phone_confirm: true });
      if (createUserError) {
          console.error("SUPABASE CREATE USER ERROR:", createUserError);
          return new Response(JSON.stringify({ error: `No se pudo crear el usuario. Razón: ${createUserError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      targetUser = newUserData.user;
      await supabase.from('profiles').update({ full_name: fullName, company_name: companyName }).eq('id', targetUser.id);
    }
    
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) throw new Error("SUPABASE_JWT_SECRET no está configurado en los secretos de la función.");

    const customToken = await sign({ 
        sub: targetUser.id,
        phone: targetUser.phone, 
        aud: 'authenticated', 
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
    }, jwtSecret, 'HS256');

    await supabase.from('otp_codes').delete().eq('phone', phone);
    
    return new Response(JSON.stringify({
      session: { access_token: customToken, token_type: 'bearer', user: targetUser },
      user: targetUser
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("FATAL ERROR in verify-whatsapp-otp:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});