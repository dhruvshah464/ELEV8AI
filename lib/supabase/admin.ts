import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. NEVER expose to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://missing-supabase-url.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "missing-service-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
