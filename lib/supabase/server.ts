import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env"

/** Server client acting as the signed-in visitor (RLS applies). For route handlers and server components. */
export async function supabaseServer(): Promise<SupabaseClient> {
  const store = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          /* called from a server component: the proxy refreshes the session instead */
        }
      },
    },
  })
}

/** The signed-in user, verified with Supabase Auth (not only the cookie). */
export async function currentUser(): Promise<User | null> {
  const { data } = await (await supabaseServer()).auth.getUser()
  return data.user ?? null
}

/** Service-role client: bypasses RLS. Server only (route handlers); never import it into a client component. */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
