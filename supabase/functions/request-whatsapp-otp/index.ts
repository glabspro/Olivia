// /supabase/functions/request-whatsapp-otp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.159.0/crypto/mod.ts";

declare const Deno: any;

// ¡IMPORTANTE! Reemplaza con la URL de producción de tu webhook de n8n
const N8N_WEBHOOK_URL = 'URL_DE_PRODUCCION_DE_TU_WEBHOOK_N8N';

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
    const { phone } = await req.json();
    if (!phone || !phone.startsWith('+')) {
      return new Response(JSON.stringify({ error: 'Falta el número de teléfono o el formato es incorrecto (debe ser +51...)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await hashText(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from('otp_codes').insert({ phone, code_hash: codeHash, expires_at: expiresAt });
    if (dbError) {
      console.error('DB Error:', dbError);
      return new Response(JSON.stringify({ error: 'No se pudo generar el código' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // No esperar la respuesta de n8n para que la función sea más rápida
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    }).catch(e => console.error("Error sending to n8n:", e));

    return new Response(JSON.stringify({ success: true, message: 'Código OTP enviado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("FATAL ERROR in request-whatsapp-otp:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
