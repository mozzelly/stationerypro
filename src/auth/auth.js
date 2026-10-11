// src/auth/auth.js

import { supabase } from '../lib/supabase.js';

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase haijaunganishwa.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    throw new Error('Akaunti hii imezimwa. Wasiliana na owner.');
  }

  return { user: data.user, profile };
}

export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  window.location.href = '/';
}

export async function getCurrentProfile() {
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !data || !data.is_active) return null;

  return data;
}

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    window.location.href = '/';
    return null;
  }

  return profile;
}

export async function requireRole(allowedRoles) {
  const profile = await requireAuth();

  if (!profile) return null;

  if (!allowedRoles.includes(profile.role)) {
    window.location.href = '/dashboard.html';
    return null;
  }

  return profile;
}