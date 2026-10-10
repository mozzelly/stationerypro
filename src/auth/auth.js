import { supabase } from "../lib/supabase.js";

export async function getSession() {
  if (!supabase) throw new Error("Supabase haijaunganishwa.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  const profile = await getProfile(data.user.id);

  if (!profile.active) {
    await supabase.auth.signOut();
    throw new Error("Akaunti yako imezimwa. Wasiliana na Owner.");
  }

  return { user: data.user, profile };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}