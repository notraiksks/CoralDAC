"use client"

/**
 * Shared mode (Supabase configured, V2-0373): photos, results and corrections live in the database; everyone sees finished photos,
 * the uploader also sees their own photos while they are analysed. No curator (V2-0361): only the uploader corrects a class, picks a
 * station or deletes.
 * Speed (V2-0381): lists load one summary row per photo (view photo_summaries: class tally, no colonies); a photo's colonies and
 * outlines load on its page (ensureDetail). Live updates refresh only the photo that changed.
 */
import * as React from "react"
import { toast } from "sonner"
import { findStation, MODEL_VERSIONS, SURVEY_STATIONS } from "./stations"
import { countClasses, finalClass } from "./classes"
import { StoreContext, type StoreValue, type UploadMeta } from "./store-context"
import { supabaseBrowser } from "./supabase/client"
import type { Detection, HealthClass, LocationSource, PhotoStatus, ReefImage, Station } from "./types"

/** login names are e-mail addresses on this placeholder domain (never mailed) */
export const ACCOUNT_DOMAIN = "coraldac.local"
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/

/**
 * Public read address of the R2 bucket with the finished WebP copies (coraldac-public), e.g. https://pub-xxxx.r2.dev. When set
 * (Vercel: NEXT_PUBLIC_R2_PUBLIC_URL), photos and thumbnails load straight from R2; when empty they go through
 * /api/photos/<id>/image (one function call and a redirect per picture).
 */
const PUBLIC_IMAGES = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/+$/, "")

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

/** a stations row -> Station (V2-0481) */
function toStation(r: any): Station {
  return {
    id: r.id, name: r.name, site: r.site, depth: r.depth === "Deep" ? "Deep" : "Shallow",
    depthM: r.depth_m == null ? null : Number(r.depth_m), lat: r.lat, lng: r.lng, createdBy: r.created_by ?? null,
  }
}

/** a photo_summaries row -> ReefImage without colonies (counts from the summary) */
function toImage(r: any): ReefImage {
  return {
    id: r.id,
    file: r.original_name ?? (r.source === "archive" ? `${r.id}.JPG` : "Uploaded photo"),
    src: PUBLIC_IMAGES ? `${PUBLIC_IMAGES}/display/${r.id}.webp` : `/api/photos/${r.id}/image?kind=display`,
    thumb: PUBLIC_IMAGES ? `${PUBLIC_IMAGES}/thumb/${r.id}.webp` : `/api/photos/${r.id}/image?kind=thumb`,
    stationId: r.station_id,
    lat: r.lat,
    lng: r.lng,
    date: r.taken_on ?? String(r.created_at ?? "").slice(0, 10),
    transect: r.transect ?? "",
    quadrat: r.quadrat,
    width: r.width ?? 0,
    height: r.height ?? 0,
    analysedRegion: Array.isArray(r.analysed_region) && r.analysed_region.length === 4 ? r.analysed_region : undefined,
    camera: r.camera ?? "",
    detections: [],
    counts: { LC: r.n_lc ?? 0, PB: r.n_pb ?? 0, DC: r.n_dc ?? 0, DCA: r.n_dca ?? 0 },
    others: r.n_others ?? 0,
    provenance: {
      source: r.source === "archive" ? "archive" : "upload",
      // "You" is set for the viewer's own photos when the list is shown (V2-0480: the list does not depend on who is signed in)
      uploader: r.source === "archive" ? SURVEY_NAME : "Contributor",
      uploadedAt: r.created_at ? String(r.created_at).slice(0, 16) : null,
      locationSource: r.location_source as LocationSource,
      models: MODEL_VERSIONS,
    },
    status: r.status as PhotoStatus,
    error: r.error,
    owner: r.owner,
  }
}

const SUMMARY = "photo_summaries"
/** survey photos loaded into the database by webapp/serving/survey_ingest.py (source 'archive', no owner) */
const SURVEY_NAME = "CoralNet survey 2024"
const PAGE = 1000 // the database answers at most 1,000 rows per request

/** uploads first (newest first), then the survey in station / date / transect / quadrat order */
function byListOrder(a: ReefImage, b: ReefImage): number {
  const sa = a.provenance.source === "archive", sb = b.provenance.source === "archive"
  if (sa !== sb) return sa ? 1 : -1
  if (!sa) return (b.provenance.uploadedAt ?? "").localeCompare(a.provenance.uploadedAt ?? "")
  return (
    (a.stationId ?? "").localeCompare(b.stationId ?? "") ||
    a.date.localeCompare(b.date) ||
    a.transect.localeCompare(b.transect, undefined, { numeric: true }) ||
    (a.quadrat ?? 0) - (b.quadrat ?? 0) ||
    a.id.localeCompare(b.id)
  )
}

export function RemoteStoreProvider({ children }: { children: React.ReactNode }) {
  const sb = supabaseBrowser()!
  const [rows, setRows] = React.useState<ReefImage[]>([])
  /** full colonies (with outlines) of the uploads whose page was opened */
  const [details, setDetails] = React.useState<Record<string, Detection[]>>({})
  const [ready, setReady] = React.useState(false)
  const [user, setUser] = React.useState<{ id: string; email: string | null } | null>(null)
  const userId = user?.id ?? null
  const detailIds = React.useRef(new Set<string>())
  /** bumped by the "Retry" button of the load-error message: reloads the list and reconnects live updates */
  const [retry, setRetry] = React.useState(0)
  /** V2-0481: survey stations first paint, then every station in the database (users can add their own) */
  const [stations, setStations] = React.useState<Station[]>(SURVEY_STATIONS)
  const [stationsReady, setStationsReady] = React.useState(false)
  const loadStations = React.useCallback(async () => {
    const { data, error } = await sb.from("stations").select("id,name,site,depth,depth_m,lat,lng,created_by").order("created_at").order("id")
    if (!error && data) setStations(data.map(toStation))
    setStationsReady(true)
  }, [sb])

  const load = React.useCallback(async () => {
    // uploads and survey photos, read in pages of 1,000, two pages at a time (V2-0480: ~1,800 photos = one round trip, not two)
    const all: ReefImage[] = []
    let error: unknown = null
    const page = (from: number) =>
      sb.from(SUMMARY).select("*").order("created_at", { ascending: false }).order("id").range(from, from + PAGE - 1)
    for (let from = 0; ; from += 2 * PAGE) {
      let pages = await Promise.all([page(from), page(from + PAGE)])
      // one quiet retry after a moment (a dropped mobile connection, a busy free-tier database) before showing an error
      if (pages.some((p) => p.error)) {
        await new Promise((r) => setTimeout(r, 1200))
        pages = await Promise.all([page(from), page(from + PAGE)])
      }
      const bad = pages.find((p) => p.error)
      if (bad) {
        error = bad.error
        break
      }
      for (const p of pages) all.push(...(p.data ?? []).map((r) => toImage(r)))
      if ((pages[1].data ?? []).length < PAGE) break
    }
    if (!error) setRows(all.sort(byListOrder))
    else
      toast.error("Could not load the shared photos", {
        id: "coraldac-load",
        description: "Check your connection.",
        action: { label: "Retry", onClick: () => setRetry((n) => n + 1) },
      })
    setReady(true)
  }, [sb])

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
        if (!data) return rest
        const next = toImage(data)
        const i = all.findIndex((r) => r.id === id)
        if (i < 0) return [next, ...rest]
        const copy = [...all]
        copy[i] = next
        return copy
      })
      if (detailIds.current.has(id)) void loadDetail(id)
    },
    [sb, loadDetail]
  )

  // V2-0480: signing in or out no longer reloads the whole list. Signed in: add the viewer's own photos that are not finished
  // (only the owner may read those); signed out: drop them.
  React.useEffect(() => {
    let alive = true
    if (!userId) {
      void Promise.resolve().then(() => alive && setRows((all) => (all.some((r) => r.status !== "done") ? all.filter((r) => r.status === "done") : all)))
    } else {
      void sb
        .from(SUMMARY)
        .select("*")
        .eq("owner", userId)
        .neq("status", "done")
        .then(({ data, error }) => {
          if (!alive || error || !data?.length) return
          const mine = data.map((r) => toImage(r))
          setRows((all) => {
            const ids = new Set(mine.map((m) => m.id))
            return [...mine, ...all.filter((r) => !ids.has(r.id))].sort(byListOrder)
          })
        })
    }
    return () => {
      alive = false
    }
  }, [sb, userId])

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
    void Promise.resolve().then(loadStations)
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
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, () => void loadStations())
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
  }, [sb, load, loadStations, refreshPhoto, retry])

  // the viewer's own uploads are labelled "You" (cheap: only those rows are copied)
  const shown = React.useMemo(
    () =>
      userId
        ? rows.map((r) => (r.owner === userId && r.provenance.source === "upload" ? { ...r, provenance: { ...r.provenance, uploader: "You" } } : r))
        : rows,
    [rows, userId]
  )
  const done = React.useMemo(() => shown.filter((r) => r.status === "done"), [shown])
  // finished uploads and the survey photos, all from the database (V2-0396: the bundled example photos are no longer shipped here)
  const images = done
  const myUploads = React.useMemo(() => (userId ? shown.filter((r) => r.owner === userId) : []), [shown, userId])
  const getImage = React.useCallback(
    (id: string) => {
      const row = shown.find((i) => i.id === id)
      if (!row) return undefined
      return details[id] ? { ...row, detections: details[id] } : row
    },
    [shown, details]
  )
  const ensureDetail = React.useCallback(
    (id: string) => {
      if (detailIds.current.has(id)) return
      detailIds.current.add(id)
      void loadDetail(id)
    },
    [loadDetail]
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
                transect: img.transect,
                quadrat: img.quadrat,
                date: img.date,
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
        // V2-0475: survey details the uploader set or corrected on the photo page
        if (prevRow.transect !== img.transect || prevRow.quadrat !== img.quadrat || prevRow.date !== img.date) {
          // only the changed fields: a photo without a date shows its upload day, which must not become its survey date
          const patch: Record<string, unknown> = {}
          if (prevRow.transect !== img.transect) patch.transect = img.transect || null
          if (prevRow.quadrat !== img.quadrat) patch.quadrat = img.quadrat
          if (prevRow.date !== img.date) patch.taken_on = img.date.slice(0, 10)
          const { error } = await sb.from("photos").update(patch).eq("id", img.id)
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
      const ids: string[] = []
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
          ids.push(j1.id)
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : "failed"}`)
        }
        onProgress?.(n + 1)
      }
      // only the new photos are read back (V2-0480: was the whole list); live updates follow their analysis
      await Promise.all(ids.map((id) => refreshPhoto(id)))
      return { sent, errors, ids }
    },
    [refreshPhoto]
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

  // ---------- stations (V2-0481): any signed-in user creates one; only its creator renames it or deletes it while it is empty ----------
  const stationById = React.useCallback((id: string | null | undefined) => findStation(stations, id), [stations])
  const stationError = (e: { code?: string; message: string }) =>
    e.code === "23505" ? "A station with that name already exists. Choose another name." : e.code === "23514" ? "Check the name (3-60 characters) and the depth (0-60 m)." : e.message
  const createStation = React.useCallback(
    async (st: { name: string; depthM: number; lat: number; lng: number }) => {
      const { data, error } = await sb
        .from("stations")
        .insert({ name: st.name.trim(), depth_m: st.depthM, lat: st.lat, lng: st.lng })
        .select("id,name,site,depth,depth_m,lat,lng,created_by")
        .single()
      if (error || !data) return { error: error ? stationError(error) : "The station was not created." }
      const made = toStation(data)
      setStations((all) => (all.some((s) => s.id === made.id) ? all : [...all, made]))
      return { station: made }
    },
    [sb]
  )
  const updateStation = React.useCallback(
    async (id: string, patch: { name: string; depthM: number }) => {
      const { data, error } = await sb.from("stations").update({ name: patch.name.trim(), depth_m: patch.depthM }).eq("id", id).select("id")
      if (error) return stationError(error)
      if (!data?.length) return "Only the person who created this station can change it."
      void loadStations()
      return null
    },
    [sb, loadStations]
  )
  const deleteStation = React.useCallback(
    async (id: string) => {
      const { data, error } = await sb.from("stations").delete().eq("id", id).select("id")
      if (error) return stationError(error)
      if (!data?.length) return "This station still has photos (or is not yours), so it cannot be deleted."
      setStations((all) => all.filter((s) => s.id !== id))
      return null
    },
    [sb]
  )

  const value = React.useMemo<StoreValue>(
    () => ({
      ready,
      stationsReady,
      stations,
      stationById,
      createStation,
      updateStation,
      deleteStation,
      images,
      myUploads,
      user,
      getImage,
      ensureDetail,
      isOwn,
      uploadPhotos,
      updateImage,
      removeUpload,
      signIn,
      signUp,
      signOut,
    }),
    [ready, stationsReady, stations, stationById, createStation, updateStation, deleteStation, images, myUploads, user, getImage, ensureDetail, isOwn,
      uploadPhotos, updateImage, removeUpload, signIn, signUp, signOut]
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
