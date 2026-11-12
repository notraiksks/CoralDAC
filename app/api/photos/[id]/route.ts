import { currentUser, supabaseAdmin } from "@/lib/supabase/server"
import { BUCKET_ORIGINALS, BUCKET_PUBLIC, deleteKeys } from "@/lib/server/r2"

/** DELETE /api/photos/<id> (the uploader only): removes the stored files and the rows (detections and private data cascade). */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await currentUser()
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 })
  const db = supabaseAdmin()
  const { data: photo } = await db
    .from("photos")
    .select("id,owner,source,original_key,display_key,thumb_key")
    .eq("id", id)
    .maybeSingle()
  if (!photo || photo.owner !== user.id || photo.source !== "upload") return Response.json({ error: "Not found." }, { status: 404 })
  await deleteKeys(BUCKET_ORIGINALS, [photo.original_key])
  await deleteKeys(BUCKET_PUBLIC, [photo.display_key, photo.thumb_key])
  const { error } = await db.from("photos").delete().eq("id", id)
  if (error) return Response.json({ error: "Could not delete." }, { status: 500 })
  return Response.json({ deleted: id })
}
