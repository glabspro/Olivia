// FIX: To resolve "Cannot find name 'Deno'" errors during static analysis without
// relying on a specific build environment configuration, a minimal Deno object is
// declared here for type-checking purposes.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Teléfono y código son requeridos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Retrieve the stored OTP hash
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otps')
      .select('otp_hash, expires_at')
      .eq('phone', phone)
      .single();

    if (otpError || !otpData) {
      throw new Error('Código no válido o no solicitado. Intenta de nuevo.');
    }
    
    // 2. Check for expiration
    if (new Date(otpData.expires_at) < new Date()) {
      throw new Error('El código ha expirado. Por favor, solicita uno nuevo.');
    }

    // 3. Hash the received OTP and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const receivedOtpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (receivedOtpHash !== otpData.otp_hash) {
      throw new Error('El código de verificación es incorrecto.');
    }

    // 4. OTP is valid, find or create the user
    let { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByPhone(phone);
    
    if (userError) {
        // User does not exist, create them
        if (userError.message === 'User not found') {
            const { data: newUser, error: creationError } = await supabaseAdmin.auth.admin.createUser({
                phone: phone,
                phone_confirm: true,
            });

            if (creationError) throw creationError;
            
            // Create a corresponding profile entry
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: newUser.user.id,
                    phone: phone,
                    // Set default names, user can update later
                    full_name: `Usuario ${phone.slice(-4)}`,
                    company_name: `Empresa de ${phone.slice(-4)}`
                });

            if (profileError) {
                 console.error("Failed to create profile for new user:", profileError);
                 // Even if profile creation fails, we can still log them in
            }

            user = newUser.user;
        } else {
            // Another error occurred
            throw userError;
        }
    }

    // 5. Generate a JWT for the user session
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) throw new Error("JWT Secret no configurado en el servidor.");

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
    
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await create({ alg: "HS256", typ: "JWT" }, { 
        aud: 'authenticated',
        exp: getNumericDate(60 * 60), // 1 hour
        sub: user.id,
        email: user.email,
        phone: user.phone,
        app_metadata: {
            provider: 'phone'
        },
        role: 'authenticated'
     }, key);

    // Here we're just creating a simple refresh token. In a real-world scenario,
    // you would store this in a database and manage its lifecycle.
    const refreshToken = "fake-refresh-token-for-demo-" + crypto.randomUUID();

    // Clean up the used OTP
    await supabaseAdmin.from('otps').delete().eq('phone', phone);
    
    const sessionData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: user
    };

    return new Response(JSON.stringify({ session: sessionData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en verify-whatsapp-otp:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
