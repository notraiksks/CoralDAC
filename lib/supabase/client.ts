import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./env"

let client: SupabaseClient | null = null

/** The browser client (session in cookies, shared with the server routes). null when Supabase is not configured. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!supabaseConfigured) return null
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
