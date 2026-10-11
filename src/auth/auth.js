import { supabase } from '../lib/supabase.js';

// Hii inatafutwa na main.js
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Hii inatafutwa na main.js na login.js
export async function getProfile(userId) {
  // Kumbuka: Badilisha 'profiles' iwe 'users' kama jedwali lako linaitwa users
  const { data, error } = await supabase
    .from('profiles') 
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
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