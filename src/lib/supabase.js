```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log("[StationeryPro] Vite mode:", import.meta.env.MODE);
console.log("[StationeryPro] URL ipo:", Boolean(supabaseUrl));
console.log("[StationeryPro] Key ipo:", Boolean(supabaseKey));

let client = null;

if (supabaseUrl && supabaseKey) {
  try {
    const validUrl = new URL(supabaseUrl);

    if (
      validUrl.protocol !== "https:" ||
      !validUrl.hostname.endsWith(".supabase.co")
    ) {
      console.error(
        "[StationeryPro] URL si Supabase Project URL sahihi."
      );
    } else {
      client = createClient(supabaseUrl, supabaseKey);
      console.log("[StationeryPro] Supabase client imeundwa.");
    }
  } catch (error) {
    console.error("[StationeryPro] URL si sahihi:", error.message);
  }
} else {
  console.error(
    "[StationeryPro] Vite haisomi URL au key. Kagua .env.local na folder kuu."
  );
}

export const supabase = client;
```
