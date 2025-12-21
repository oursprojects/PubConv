// @ts-nocheck
// Supabase Edge Function: verify-recaptcha
// Deploy this via Supabase Dashboard > Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { token } = await req.json()

        if (!token) {
            return new Response(
                JSON.stringify({ success: false, error: 'No token provided' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Verify with Google reCAPTCHA
        const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY')

        if (!secretKey) {
            return new Response(
                JSON.stringify({ success: false, error: 'Server configuration error' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`,
        })

        const verifyData = await verifyResponse.json()

        return new Response(
            JSON.stringify({ success: verifyData.success }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
