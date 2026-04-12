import { createBrowserClient } from "@supabase/ssr";

// Singleton — reuse the same client instance across all components
// This prevents infinite re-renders when `supabase` is used in useEffect deps
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://missing-supabase-url.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-anon-key"
  );
  return client;
}
