// /supabase/functions/verify-whatsapp-otp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.159.0/crypto/mod.ts";
import { sign } from 'https://deno.land/x/djwt@v2.2/mod.ts'

// FIX: Add Deno global type to fix 'Cannot find name 'Deno'' TypeScript errors.
// This is necessary when the editor/linter is not configured for a Deno environment.
declare const Deno: any;

// Función para hashear texto de forma segura
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  // FIX: Corrected hashing algorithm from 'SHA-26' to 'SHA-256' and fixed a syntax error.
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  try {
    const { phone, code, fullName, companyName } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'El teléfono y el código son requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // 1. Buscar el código en la BD
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes').select('code_hash, expires_at').eq('phone', phone)
      .order('created_at', { ascending: false }).limit(1).single();

    if (otpError || !otpData) {
      return new Response(JSON.stringify({ error: 'Código incorrecto o no solicitado.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // 2. Verificar que no haya expirado y que el hash coincida
    if (new Date(otpData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'El código ha expirado.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const receivedCodeHash = await hashText(code);
    if (receivedCodeHash !== otpData.code_hash) {
      return new Response(JSON.stringify({ error: 'Código incorrecto.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Autenticar o crear usuario
    // Nota: getUserByPhone no requiere el '+'
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByPhone(phone.substring(1));
    
    let targetUser = user;

    if (getUserError || !targetUser) { // Si el usuario no existe, lo creamos
      const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({ phone, phone_confirm: true });
      if (createUserError) {
          console.error("SUPABASE CREATE USER ERROR:", createUserError);
          return new Response(JSON.stringify({ error: `No se pudo crear el usuario. Razón: ${createUserError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      targetUser = newUserData.user;
      // Actualizamos el perfil recién creado por el trigger
      await supabase.from('profiles').update({ full_name: fullName, company_name: companyName }).eq('id', targetUser.id);
    }
    
    // 4. Generar la sesión de forma segura
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) throw new Error("SUPABASE_JWT_SECRET no está configurado en los secretos de la función.");

    // FIX: Añadir el algoritmo 'HS256' es el paso crucial que faltaba.
    const customToken = await sign({ 
        sub: targetUser.id,
        phone: targetUser.phone, 
        aud: 'authenticated', 
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // Válido por 1 semana
    }, jwtSecret, 'HS256');

    // 5. Borrar el código OTP usado
    await supabase.from('otp_codes').delete().eq('phone', phone);
    
    // 6. Devolver la sesión al frontend
    return new Response(JSON.stringify({
      session: { access_token: customToken, token_type: 'bearer', user: targetUser },
      user: targetUser
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("FATAL ERROR in verify-whatsapp-otp:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
