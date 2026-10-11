// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Supabase haijaunganishwa. Kagua VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY kwenye .env.local.'
  );
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export async function testSupabaseConnection() {
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase credentials hazijawekwa.',
    };
  }

  const { error } = await supabase
    .from('business_settings')
    .select('id')
    .limit(1);

  if (error) {
    return {
      connected: false,
      message: error.message,
    };
  }

  return {
    connected: true,
    message: 'Supabase imeunganishwa.',
  };
}