/**
 * Sends one analysis job to the Modal GPU worker (Pipeline-V2 webapp/serving/modal_app.py, POST jobs). Returns false when the
 * worker is not configured or unreachable; the photo then stays "queued" and the sweeper re-sends it.
 */
/** true when the GPU worker is configured, so new uploads can be analyzed (V2-0396: uploads are paused otherwise) */
export function analysisAvailable(): boolean {
  return Boolean(process.env.MODAL_JOBS_URL && process.env.MODAL_SHARED_SECRET)
}

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
