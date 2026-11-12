"use client"

/**
 * Shared mode (Supabase configured, V2-0373): photos, results and corrections live in the database; everyone sees finished photos,
 * the uploader also sees their own photos while they are analysed. No curator (V2-0361): only the uploader corrects a class, picks a
 * station or deletes. The 42 example photos stay in lib/archive.
 * Speed (V2-0381): lists load one summary row per photo (view photo_summaries: class tally, no colonies); a photo's colonies and
 * outlines load on its page (ensureDetail). Live updates refresh only the photo that changed.
 */
import * as React from "react"
import { toast } from "sonner"
import { ARCHIVE_IMAGES, MODEL_VERSIONS } from "./archive"
import { countClasses, finalClass } from "./classes"
import { useArchiveMasks, withMasks } from "./details"
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

/** a photo_summaries row -> ReefImage without colonies (counts from the summary) */
function toImage(r: any, me: string | null): ReefImage {
  return {
    id: r.id,
    file: r.original_name ?? "Uploaded photo",
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
    detections: [],
    counts: { LC: r.n_lc ?? 0, PB: r.n_pb ?? 0, DC: r.n_dc ?? 0, DCA: r.n_dca ?? 0 },
    others: r.n_others ?? 0,
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

const SUMMARY = "photo_summaries"

export function RemoteStoreProvider({ children }: { children: React.ReactNode }) {
  const sb = supabaseBrowser()!
  const [rows, setRows] = React.useState<ReefImage[]>([])
  /** full colonies (with outlines) of the uploads whose page was opened */
  const [details, setDetails] = React.useState<Record<string, Detection[]>>({})
  const [masks, loadMasks] = useArchiveMasks()
  const [ready, setReady] = React.useState(false)
  const [user, setUser] = React.useState<{ id: string; email: string | null } | null>(null)
  const userId = user?.id ?? null
  const detailIds = React.useRef(new Set<string>())
  /** bumped by the "Retry" button of the load-error message: reloads the list and reconnects live updates */
  const [retry, setRetry] = React.useState(0)

  const load = React.useCallback(async () => {
    const { data, error } = await sb.from(SUMMARY).select("*").eq("source", "upload").order("created_at", { ascending: false })
    if (!error) setRows((data ?? []).map((r) => toImage(r, userId)))
    else
      toast.error("Could not load the shared photos", {
        id: "coraldac-load",
        description: "The example photos are shown. Check your connection.",
        action: { label: "Retry", onClick: () => setRetry((n) => n + 1) },
      })
    setReady(true)
  }, [sb, userId])

  const loadDetail = React.useCallback(
    async (id: string) => {
      const { data, error } = await sb.from("detections").select("*").eq("photo_id", id).order("label")
      if (!error) setDetails((all) => ({ ...all, [id]: (data ?? []).map(toDetection) }))
      else detailIds.current.delete(id) // asked again the next time the photo is opened
    },
    [sb]
  )

  /** re-reads one photo's summary (and its colonies when its page was opened) */
  const refreshPhoto = React.useCallback(
    async (id: string) => {
      const { data } = await sb.from(SUMMARY).select("*").eq("id", id).maybeSingle()
      setRows((all) => {
        const rest = all.filter((r) => r.id !== id)
        if (!data || data.source !== "upload") return rest
        const next = toImage(data, userId)
        const i = all.findIndex((r) => r.id === id)
        if (i < 0) return [next, ...rest]
        const copy = [...all]
        copy[i] = next
        return copy
      })
      if (detailIds.current.has(id)) void loadDetail(id)
    },
    [sb, userId, loadDetail]
  )

  // who is signed in
  React.useEffect(() => {
    void sb.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null))
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null)
    )
    return () => sub.subscription.unsubscribe()
  }, [sb])

  // data + live updates: each change refreshes only its photo (debounced per photo, e.g. the worker inserting 15 colonies)
  React.useEffect(() => {
    void Promise.resolve().then(load) // state is set after the fetch, not during the effect
    const timers = new Map<string, ReturnType<typeof setTimeout>>()
    const later = (id: unknown) => {
      if (typeof id !== "string" || !id) return
      clearTimeout(timers.get(id))
      timers.set(id, setTimeout(() => {
        timers.delete(id)
        void refreshPhoto(id)
      }, 500))
    }
    const ch = sb
      .channel("coraldac-photos")
      .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, (p: any) => later(p.new?.id ?? p.old?.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "detections" }, (p: any) => later(p.new?.photo_id ?? p.old?.photo_id))
      .subscribe()
    // live updates are missed while the tab sleeps or the network drops: re-read the list when it comes back
    let hiddenAt = 0
    const onVisible = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 120_000) void load()
    }
    const onOnline = () => void load()
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      timers.forEach((t) => clearTimeout(t))
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
      void sb.removeChannel(ch)
    }
  }, [sb, load, refreshPhoto, retry])

  const done = React.useMemo(() => rows.filter((r) => r.status === "done"), [rows])
  const images = React.useMemo(() => [...done, ...ARCHIVE_IMAGES], [done])
  const myUploads = React.useMemo(() => (userId ? rows.filter((r) => r.owner === userId) : []), [rows, userId])
  const getImage = React.useCallback(
    (id: string) => {
      const row = rows.find((i) => i.id === id)
      if (row) return details[id] ? { ...row, detections: details[id] } : row
      const a = ARCHIVE_IMAGES.find((i) => i.id === id)
      return a ? withMasks(a, masks[id]) : undefined
    },
    [rows, details, masks]
  )
  const ensureDetail = React.useCallback(
    (id: string) => {
      if (ARCHIVE_IMAGES.some((a) => a.id === id)) return loadMasks(id)
      if (detailIds.current.has(id)) return
      detailIds.current.add(id)
      void loadDetail(id)
    },
    [loadMasks, loadDetail]
  )
  const isOwn = React.useCallback((img: ReefImage) => Boolean(userId && img.owner === userId), [userId])

  const updateImage = React.useCallback(
    (img: ReefImage) => {
      const prevRow = rows.find((r) => r.id === img.id)
      if (!prevRow || prevRow.owner !== userId) return
      const prevDets = details[img.id] ?? []
      // optimistic: the page and the tallies change at once
      setRows((all) =>
        all.map((r) =>
          r.id === img.id
            ? {
                ...r,
                stationId: img.stationId,
                lat: img.lat,
                lng: img.lng,
                provenance: img.provenance,
                ...(img.detections.length
                  ? { counts: countClasses(img.detections), others: img.detections.filter((d) => finalClass(d) === "OTHERS").length }
                  : {}),
              }
            : r
        )
      )
      if (img.detections.length) setDetails((all) => ({ ...all, [img.id]: img.detections }))
      void (async () => {
        let failed = false
        if (prevRow.stationId !== img.stationId || prevRow.lat !== img.lat || prevRow.lng !== img.lng ||
            prevRow.provenance.locationSource !== img.provenance.locationSource) {
          const { error } = await sb.from("photos").update({
            station_id: img.stationId, lat: img.lat, lng: img.lng, location_source: img.provenance.locationSource,
          }).eq("id", img.id)
          if (error) failed = true
        }
        if (prevDets.length) {
          const before = new Map(prevDets.map((d) => [d.dbId, d.corrected ?? null]))
          const res = await Promise.all(
            img.detections
              .filter((d) => d.dbId && before.has(d.dbId) && before.get(d.dbId) !== (d.corrected ?? null))
              .map((d) => sb.from("detections").update({ corrected: d.corrected ?? null }).eq("id", d.dbId!))
          )
          if (res.some((r) => r.error)) failed = true
        }
        if (failed) {
          // undo the optimistic change with what the database really holds
          toast.error("The change was not saved", { description: "Check your connection and try again." })
          void refreshPhoto(img.id)
        }
      })().catch(() => {
        toast.error("The change was not saved", { description: "Check your connection and try again." })
        void refreshPhoto(img.id)
      })
    },
    [rows, details, sb, userId, refreshPhoto]
  )

  // optimistic delete: gone from the page at once, back if the server refuses
  const removeUpload = React.useCallback(
    async (id: string) => {
      const kept = rows.find((r) => r.id === id)
      setRows((all) => all.filter((r) => r.id !== id))
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" }).catch(() => null)
      if (!res || !res.ok) {
        if (kept) setRows((all) => (all.some((r) => r.id === id) ? all : [kept, ...all]))
        throw new Error((await res?.json().catch(() => ({})))?.error ?? "Could not delete.")
      }
    },
    [rows]
  )

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

  // Username "demo" is the login
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
      ensureDetail,
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
    [ready, images, myUploads, user, getImage, ensureDetail, isOwn, uploadPhotos, updateImage, removeUpload, signIn, signUp, signOut]
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
