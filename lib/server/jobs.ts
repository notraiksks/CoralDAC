import { supabaseAdmin } from "@/lib/supabase/server"

/**
 * Analysis jobs. V2-0474: the analysis runs in a Colab notebook (Pipeline-V2 webapp/serving/coraldac_worker.py) that takes "queued"
 * photos from the database itself and stamps public.worker_heartbeat every 30 s while it runs. The Modal worker
 * (webapp/serving/modal_app.py, POST jobs) is still supported when MODAL_JOBS_URL and MODAL_SHARED_SECRET are set.
 */
const FRESH_MS = 90_000

/** true when a worker can analyze new uploads now (V2-0396: uploads are paused otherwise, so photos never wait for nobody) */
export async function analysisAvailable(): Promise<boolean> {
  if (process.env.MODAL_JOBS_URL && process.env.MODAL_SHARED_SECRET) return true
  try {
    const since = new Date(Date.now() - FRESH_MS).toISOString()
    const { count, error } = await supabaseAdmin()
      .from("worker_heartbeat")
      .select("id", { count: "exact", head: true })
      .gte("last_seen", since)
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}

/** Sends one job to the Modal worker when it is configured; otherwise the photo stays "queued" and the Colab worker picks it up. */
export async function dispatchJob(photoId: string): Promise<boolean> {
  const url = process.env.MODAL_JOBS_URL
  const secret = process.env.MODAL_SHARED_SECRET
  if (!url || !secret) return false
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-coraldac-secret": secret },
      body: JSON.stringify({ photo_id: photoId }),
      signal: AbortSignal.timeout(15000),
    })
    return res.ok
  } catch {
    return false
  }
}
