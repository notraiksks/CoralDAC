import type { NextRequest } from "next/server"
import { BUCKET_PUBLIC, presignGet } from "@/lib/server/r2"

/**
 * GET /api/photos/<id>/image?kind=display|thumb -> redirect to a 1-hour signed link of the WebP copy made by the worker.
 * No database lookup (V2-0381, speed): the copies exist only for finished photos, which are public anyway, and signing is local.
 */
const ID_RE = /^[0-9a-f-]{36}$/

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!ID_RE.test(id)) return new Response("Not found", { status: 404 })
  const kind = request.nextUrl.searchParams.get("kind") === "thumb" ? "thumb" : "display"
  const url = await presignGet(BUCKET_PUBLIC, `${kind}/${id}.webp`)
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "private, max-age=1800" } })
}
