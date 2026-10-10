
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log(
  "VITE_SUPABASE_URL ipo:",
  Boolean(supabaseUrl)
);

console.log(
  "VITE_SUPABASE_ANON_KEY ipo:",
  Boolean(supabaseKey)
);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase connection haijaanzishwa. Kagua .env.local."
  );
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;