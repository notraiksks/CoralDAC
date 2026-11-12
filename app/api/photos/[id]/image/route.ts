import type { NextRequest } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { BUCKET_PUBLIC, presignGet } from "@/lib/server/r2"

/**
 * GET /api/photos/<id>/image?kind=display|thumb -> redirect to a 1-hour signed link of the WebP copy made by the worker. Visibility
 * follows RLS (finished photos for everyone, the uploader's own photos in every state), because the row is read as the visitor.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const kind = request.nextUrl.searchParams.get("kind") === "thumb" ? "thumb" : "display"
  const { data: photo } = await (await supabaseServer())
    .from("photos")
    .select("display_key,thumb_key")
    .eq("id", id)
    .maybeSingle()
  const key = kind === "thumb" ? photo?.thumb_key : photo?.display_key
  if (!key) return new Response("Not found", { status: 404 })
  const url = await presignGet(BUCKET_PUBLIC, key)
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "private, max-age=1800" } })
}
