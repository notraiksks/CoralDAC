import { currentUser, supabaseAdmin } from "@/lib/supabase/server"
import { BUCKET_ORIGINALS, deleteKeys, headObject } from "@/lib/server/r2"
import { dispatchJob } from "@/lib/server/jobs"

/** POST /api/uploads/<id>/submit (the uploader): checks the file reached R2, marks the photo "queued" and sends the job. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await currentUser()
  if (!user) return Response.json({ error: "Sign in to upload." }, { status: 401 })
  const db = supabaseAdmin()
  const { data: photo } = await db.from("photos").select("id,owner,status,original_key").eq("id", id).maybeSingle()
  if (!photo || photo.owner !== user.id) return Response.json({ error: "Not found." }, { status: 404 })
  if (photo.status !== "uploading") return Response.json({ id, status: photo.status })

  const head = await headObject(BUCKET_ORIGINALS, photo.original_key)
  if (!head) return Response.json({ error: "The file did not arrive; try again." }, { status: 409 })
  if (head.size > 10 * 1024 * 1024) {
    await deleteKeys(BUCKET_ORIGINALS, [photo.original_key])
    await db.from("photos").delete().eq("id", id)
    return Response.json({ error: "Photos must be at most 10 MB." }, { status: 413 })
  }
  // last_dispatch_at: the database sweeper re-sends only photos not sent in the last 5 minutes (V2-0381)
  await db.from("photos").update({ status: "queued", last_dispatch_at: new Date().toISOString() }).eq("id", id)
  const sent = await dispatchJob(id)
  return Response.json({ id, status: "queued", sent })
}
