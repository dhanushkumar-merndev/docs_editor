import { createClient } from "@supabase/supabase-js";

let supabaseBrowserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (typeof window === "undefined") {
    return createClient(url, key);
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createClient(url, key);
  }
  return supabaseBrowserClient;
}

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
