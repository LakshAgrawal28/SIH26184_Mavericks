import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const supabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client (publishable key). Returns null if env is not set.
 * Scans and artefacts are stored in the FastAPI backend database (DATABASE_URL), not via Supabase client.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
