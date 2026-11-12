"use client"

/**
 * Shared mode (Supabase configured, V2-0373): photos, results and corrections live in the database; everyone sees finished photos,
 * the uploader also sees their own photos while they are analysed. No curator (V2-0361): only the uploader corrects a class, picks a
 * station or deletes. Results arrive live (Realtime) when the GPU worker finishes. The 42 example photos stay in lib/archive.
 */
import * as React from "react"
import { ARCHIVE_IMAGES, MODEL_VERSIONS } from "./archive"
import { StoreContext, type StoreValue, type UploadMeta } from "./store-context"
import { supabaseBrowser } from "./supabase/client"
import type { Detection, HealthClass, LocationSource, PhotoStatus, ReefImage } from "./types"

/** login names are e-mail addresses on this placeholder domain (never mailed) */
export const ACCOUNT_DOMAIN = "coraldac.local"
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDetection(r: any): Detection {
  const health = r.filter === "OTHERS" ? undefined : ((r.health ?? undefined) as HealthClass | undefined)
  return {
    id: r.label,
    dbId: r.id,
    box: [r.box_x, r.box_y, r.box_w, r.box_h],
    detConf: r.det_conf,
    filter: r.filter,
    filterConf: r.filter_conf,
    health,
    healthConf: r.health_conf ?? undefined,
    pOthers: r.p_others ?? undefined,
    p: r.p_lc != null ? { LC: r.p_lc, PB: r.p_pb, DC: r.p_dc, DCA: r.p_dca } : undefined,
    maskFallback: r.mask_fallback ?? undefined,
    mask: Array.isArray(r.mask) ? (r.mask as [number, number][]) : undefined,
    corrected: r.corrected ?? undefined,
  }
}

function toImage(r: any, me: string | null): ReefImage {
  const priv = Array.isArray(r.photo_private) ? r.photo_private[0] : r.photo_private
  const dets = ((r.detections ?? []) as any[]).map(toDetection).sort((a, b) => a.id.localeCompare(b.id))
  return {
    id: r.id,
    file: priv?.original_name ?? "Uploaded photo",
    src: `/api/photos/${r.id}/image?kind=display`,
    thumb: `/api/photos/${r.id}/image?kind=thumb`,
    stationId: r.station_id,
    lat: r.lat,
    lng: r.lng,
    date: r.taken_on ?? String(r.created_at ?? "").slice(0, 10),
    transect: r.transect ?? "",
    quadrat: r.quadrat,
    width: r.width ?? 0,
    height: r.height ?? 0,
    camera: r.camera ?? "",
    detections: dets,
    provenance: {
      source: "upload",
      uploader: me && r.owner === me ? "You" : "Contributor",
      uploadedAt: r.created_at ? String(r.created_at).slice(0, 16) : null,
      locationSource: r.location_source as LocationSource,
      models: MODEL_VERSIONS,
      simulated: false,
    },
    status: r.status as PhotoStatus,
    error: r.error,
    owner: r.owner,
  }
}

export function RemoteStoreProvider({ children }: { children: React.ReactNode }) {
  const sb = supabaseBrowser()!
  const [rows, setRows] = React.useState<ReefImage[]>([])
  const [ready, setReady] = React.useState(false)
  const [user, setUser] = React.useState<{ id: string; email: string | null } | null>(null)
  const userId = user?.id ?? null

  const load = React.useCallback(async () => {
    const { data, error } = await sb
      .from("photos")
      .select("*, photo_private(original_name), detections(*)")
      .eq("source", "upload")
      .order("created_at", { ascending: false })
    if (!error) setRows((data ?? []).map((r) => toImage(r, userId)))
    setReady(true)
  }, [sb, userId])

  // who is signed in
  React.useEffect(() => {
    void sb.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null))
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null)
    )
    return () => sub.subscription.unsubscribe()
  }, [sb])

  // data + live updates (a small project: refetch everything, debounced)
  React.useEffect(() => {
    void Promise.resolve().then(load) // state is set after the fetch, not during the effect
    let t: ReturnType<typeof setTimeout> | undefined
    const later = () => {
      clearTimeout(t)
      t = setTimeout(() => void load(), 400)
    }
    const ch = sb
      .channel("coraldac-photos")
      .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, later)
      .on("postgres_changes", { event: "*", schema: "public", table: "detections" }, later)
      .subscribe()
    return () => {
      clearTimeout(t)
      void sb.removeChannel(ch)
    }
  }, [sb, load])

  const done = React.useMemo(() => rows.filter((r) => r.status === "done"), [rows])
  const images = React.useMemo(() => [...done, ...ARCHIVE_IMAGES], [done])
  const myUploads = React.useMemo(() => (userId ? rows.filter((r) => r.owner === userId) : []), [rows, userId])
  const getImage = React.useCallback(
    (id: string) => rows.find((i) => i.id === id) ?? ARCHIVE_IMAGES.find((i) => i.id === id),
    [rows]
  )
  const isOwn = React.useCallback((img: ReefImage) => Boolean(userId && img.owner === userId), [userId])

  const updateImage = React.useCallback(
    (img: ReefImage) => {
      const prev = rows.find((r) => r.id === img.id)
      if (!prev || prev.owner !== userId) return
      setRows((all) => all.map((r) => (r.id === img.id ? img : r)))
      void (async () => {
        if (prev.stationId !== img.stationId || prev.lat !== img.lat || prev.lng !== img.lng ||
            prev.provenance.locationSource !== img.provenance.locationSource) {
          await sb.from("photos").update({
            station_id: img.stationId, lat: img.lat, lng: img.lng, location_source: img.provenance.locationSource,
          }).eq("id", img.id)
        }
        const before = new Map(prev.detections.map((d) => [d.dbId, d.corrected ?? null]))
        for (const d of img.detections) {
          if (d.dbId && before.get(d.dbId) !== (d.corrected ?? null)) {
            await sb.from("detections").update({ corrected: d.corrected ?? null }).eq("id", d.dbId)
          }
        }
      })()
    },
    [rows, sb, userId]
  )

  const removeUpload = React.useCallback(async (id: string) => {
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not delete.")
    setRows((all) => all.filter((r) => r.id !== id))
  }, [])

  const uploadPhotos = React.useCallback(
    async (items: { file: File; meta: UploadMeta }[], onProgress?: (done: number) => void) => {
      const errors: string[] = []
      let sent = 0
      for (const [n, { file, meta }] of items.entries()) {
        try {
          const type = /\.png$/i.test(file.name) ? "image/png" : "image/jpeg"
          const r1 = await fetch("/api/uploads", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: file.name, type, size: file.size, ...meta }),
          })
          const j1 = await r1.json()
          if (!r1.ok) throw new Error(j1.error ?? `upload refused (${r1.status})`)
          const put = await fetch(j1.uploadUrl, { method: "PUT", headers: { "content-type": j1.contentType }, body: file })
          if (!put.ok) throw new Error(`storage refused the file (${put.status})`)
          const r2 = await fetch(`/api/uploads/${j1.id}/submit`, { method: "POST" })
          const j2 = await r2.json()
          if (!r2.ok) throw new Error(j2.error ?? `submit failed (${r2.status})`)
          sent++
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : "failed"}`)
        }
        onProgress?.(n + 1)
      }
      await load()
      return { sent, errors }
    },
    [load]
  )

  // Accounts are created by the project in Supabase (no sign-up, no e-mails, V2-0376); a username "demo" is the login
  // e-mail "demo@coraldac.local". Typing a full address also works.
  const signIn = React.useCallback(
    async (username: string, password: string) => {
      const u = username.trim().toLowerCase()
      const email = u.includes("@") ? u : `${u}@${ACCOUNT_DOMAIN}`
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (!error) return null
      return /invalid login credentials/i.test(error.message) ? "Wrong username or password." : error.message
    },
    [sb]
  )
  // Sign-up (Rai, V2-0378): the login is the username (stored as username@coraldac.local, never mailed); a real e-mail is optional
  // and kept only as contact in the account's metadata. Needs "Confirm email" off in Supabase so the account works at once.
  const signUp = React.useCallback(
    async (username: string, password: string, contact?: string) => {
      const u = username.trim().toLowerCase()
      if (!USERNAME_RE.test(u)) return "Username: 3-30 characters, letters, numbers, dot, dash or underscore."
      if (password.length < 8) return "Password: at least 8 characters."
      const mail = contact?.trim() || null
      const { data, error } = await sb.auth.signUp({
        email: `${u}@${ACCOUNT_DOMAIN}`,
        password,
        options: { data: { username: u, contact_email: mail } },
      })
      if (error) return /already registered|already exists/i.test(error.message) ? "That username is taken." : error.message
      if (!data.session) return "Account created, but it needs confirming before it can sign in. Ask the project team."
      return null
    },
    [sb]
  )
  const signOut = React.useCallback(async () => {
    await sb.auth.signOut()
  }, [sb])

  const value = React.useMemo<StoreValue>(
    () => ({
      remote: true,
      ready,
      images,
      myUploads,
      user,
      getImage,
      isOwn,
      addUploads: async () => {},
      uploadPhotos,
      updateImage,
      removeUpload,
      clearUploads: async () => {},
      signIn,
      signUp,
      signOut,
    }),
    [ready, images, myUploads, user, getImage, isOwn, uploadPhotos, updateImage, removeUpload, signIn, signUp, signOut]
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
