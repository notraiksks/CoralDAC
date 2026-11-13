import { randomUUID } from "node:crypto"
import { currentUser, supabaseAdmin } from "@/lib/supabase/server"
import { presignUpload } from "@/lib/server/r2"
import { isTestPhotoName } from "@/lib/server/test-photos"
import { analysisAvailable } from "@/lib/server/jobs"

/**
 * POST /api/uploads  (signed in)  { name, type, size, stationId?, lat?, lng?, locationSource?, takenOn?, transect?, quadrat?,
 *                                   camera?, exifLat?, exifLng? }
 * -> { id, uploadUrl, contentType }: a photos row in state "uploading" and a 10-minute presigned PUT to R2. The browser then PUTs the
 * file and calls POST /api/uploads/<id>/submit.
 */
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" }
const PAUSED = "Analysis of new photos is not available yet. Uploads will open once the analysis server is running."

/** GET /api/uploads -> { open }: whether new uploads can be analyzed now (the upload page asks before showing the form) */
export function GET() {
  return Response.json({ open: analysisAvailable() }, { headers: { "cache-control": "no-store" } })
}
const MAX_BYTES = 10 * 1024 * 1024
const DAILY_LIMIT = Number(process.env.UPLOADS_PER_DAY ?? 30)

const num = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null)

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return Response.json({ error: "Sign in to upload." }, { status: 401 })
  // without the GPU worker a photo would wait for analysis forever
  if (!analysisAvailable()) return Response.json({ error: PAUSED }, { status: 503 })
  let b: Record<string, unknown>
  try {
    b = await request.json()
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 })
  }
  const name = str(b.name, 200)
  const type = typeof b.type === "string" ? b.type : ""
  const size = Number(b.size)
  if (!name || !TYPES[type]) return Response.json({ error: "Only JPG, JPEG or PNG photos are accepted." }, { status: 415 })
  if (!(size > 0 && size <= MAX_BYTES)) return Response.json({ error: "Photos must be at most 10 MB." }, { status: 413 })
  const db = supabaseAdmin()
  // survey photos are already on the map (their ids are their file names): an upload would count them twice
  const stem = name.replace(/\.[^.]+$/, "")
  const { count: inSurvey } = await db
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("source", "archive")
    .in("id", [...new Set([stem, stem.toUpperCase()])])
  if ((inSurvey ?? 0) > 0 || isTestPhotoName(name))
    return Response.json({ error: `${name} is already part of the 2024 survey on the map.` }, { status: 422 })

  // open sign-up (V2-0378): cap GPU use per account
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await db.from("photos").select("id", { count: "exact", head: true }).eq("owner", user.id).gte("created_at", since)
  if ((count ?? 0) >= DAILY_LIMIT)
    return Response.json({ error: `Limit reached: ${DAILY_LIMIT} photos per account per day. Try again tomorrow.` }, { status: 429 })
  let stationId = str(b.stationId, 64)
  let lat = num(b.lat, -90, 90)
  let lng = num(b.lng, -180, 180)
  let locationSource = ["station", "exif", "manual", "none"].includes(String(b.locationSource)) ? String(b.locationSource) : "none"
  if (stationId) {
    const { data: st } = await db.from("stations").select("id,lat,lng").eq("id", stationId).maybeSingle()
    if (!st) stationId = null
    else {
      lat = st.lat
      lng = st.lng
      locationSource = "station"
    }
  }
  if (!stationId && (lat == null || lng == null)) {
    lat = null
    lng = null
    locationSource = "none"
  }

  const id = randomUUID()
  const key = `originals/${id}.${TYPES[type]}`
  const quadrat = Number.isInteger(b.quadrat) ? (b.quadrat as number) : null
  const takenOn = typeof b.takenOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.takenOn) ? b.takenOn : null
  const { error } = await db.from("photos").insert({
    id, owner: user.id, source: "upload", status: "uploading", station_id: stationId, lat, lng, location_source: locationSource,
    taken_on: takenOn, transect: str(b.transect, 32), quadrat, camera: str(b.camera, 80), original_key: key,
  })
  if (error) return Response.json({ error: "Could not register the upload." }, { status: 500 })
  await db.from("photo_private").insert({
    photo_id: id, original_name: name, exif_lat: num(b.exifLat, -90, 90), exif_lng: num(b.exifLng, -180, 180),
  })
  const uploadUrl = await presignUpload(key, type)
  return Response.json({ id, uploadUrl, contentType: type })
}
