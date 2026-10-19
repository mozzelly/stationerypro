import { supabase } from '../lib/supabase.js';

// Hii inatafutwa na main.js
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Hii inatafutwa na main.js na login.js
export async function getProfile(userId) {
  // ✅ MAREKEBISHO: Tumia .maybeSingle() badala ya .single()
  // Hii inazuia error kama profaili haipo au RLS inazuia
  const { data, error } = await supabase
    .from('profiles') 
    .select('*')
    .eq('id', userId)
    .maybeSingle(); // ✅ Salama zaidi

  if (error) {
    console.error('Error fetching profile:', error);
    return null; // Rudisha null badala ya ku-crash mfumo
  }
  
  return data;
}

// Hii inatafutwa na main.js
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Hii inatafutwa na login.js
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}