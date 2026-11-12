import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env"

/**
 * Keeps the Supabase sign-in session fresh (cookies) for the server routes. Runs on /api only (V2-0381, speed): page
 * navigations no longer wait for a round trip to Supabase; the browser client refreshes its own session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!supabaseConfigured) return response
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v))
      },
    },
  })
  await supabase.auth.getUser()
  return response
}

export const config = {
  // not /api/photos/<id>/image: thumbnails need no session
  matcher: ["/api/uploads/:path*", "/api/photos/:id"],
}
