import { createClient } from '@supabase/supabase-js';

// WEKA HAPA MOJA KWA MOJA
const supabaseUrl = 'https://hijycfvjyozjgcgkqmkl.supabase.co';
const supabaseAnonKey = 'sb_publishable_aMD74RSdrlxF8BdxdBpjNw_VvbdyVxK'; // WEKA KEY YOTE HAPA

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function requireSupabase() {
  return supabase;
}