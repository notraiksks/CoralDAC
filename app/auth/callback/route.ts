import { NextResponse, type NextRequest } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** Magic-link landing: exchanges the one-time code for a session cookie, then returns to the page the visitor came from. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") ?? "/upload"
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/upload"
  if (code) {
    const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin))
  }
  return NextResponse.redirect(new URL("/upload?signin=failed", url.origin))
}
