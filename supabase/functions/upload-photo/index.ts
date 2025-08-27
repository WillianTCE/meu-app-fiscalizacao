// supabase/functions/upload-photo/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath, base64Data } = await req.json()

    if (!filePath || !base64Data) {
      throw new Error('Caminho do arquivo (filePath) ou dados da imagem (base64Data) não fornecidos.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileBody = decode(base64Data)

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('inspection-photos')
      .upload(filePath, fileBody, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    return new Response(JSON.stringify({ path: data.path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})