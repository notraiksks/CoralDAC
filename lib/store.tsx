"use client"

/**
 * Client-side state until the backend exists:
 * - uploads (photo blob + record) live in IndexedDB, so they survive a refresh
 * - review decisions and class edits on archive images live in localStorage
 * - the demo role lives in localStorage
 */
import * as React from "react"
import { ARCHIVE_IMAGES } from "./archive"
import type { ReefImage, Role } from "./types"

const DB_NAME = "coraldac"
const STORE = "uploads"
const OVERRIDES_KEY = "coraldac-overrides-v2"
const ROLE_KEY = "coraldac-role"

type UploadRecord = Omit<ReefImage, "src" | "thumb"> & { blob: Blob }
type Override = Pick<ReefImage, "status" | "detections" | "provenance">

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function readOverrides(): Record<string, Override> {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}")
  } catch {
    return {}
  }
}

interface StoreValue {
  ready: boolean
  images: ReefImage[]
  role: Role
  setRole: (r: Role) => void
  getImage: (id: string) => ReefImage | undefined
  addUploads: (items: { image: ReefImage; file: File }[]) => Promise<void>
  updateImage: (img: ReefImage) => void
  resetDemo: () => Promise<void>
}

const StoreContext = React.createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [archive, setArchive] = React.useState<ReefImage[]>(ARCHIVE_IMAGES)
  const [uploads, setUploads] = React.useState<ReefImage[]>([])
  const [role, setRoleState] = React.useState<Role>("contributor")
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let urls: string[] = []
    const ov = readOverrides()
    const savedRole = (() => {
      try {
        return localStorage.getItem(ROLE_KEY) as Role | null
      } catch {
        return null
      }
    })()
    idb<UploadRecord[]>("readonly", (s) => s.getAll())
      .catch(() => [] as UploadRecord[])
      .then((recs) => {
        const loaded = recs.map(({ blob, ...rest }) => {
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return { ...rest, src: url, thumb: url } as ReefImage
        })
        loaded.sort((a, b) => (b.provenance.uploadedAt ?? "").localeCompare(a.provenance.uploadedAt ?? ""))
        setArchive(ARCHIVE_IMAGES.map((img) => (ov[img.id] ? { ...img, ...ov[img.id] } : img)))
        setUploads(loaded)
        if (savedRole) setRoleState(savedRole)
        setReady(true)
      })
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls = []
    }
  }, [])

  const images = React.useMemo(() => [...uploads, ...archive], [uploads, archive])

  const setRole = React.useCallback((r: Role) => {
    setRoleState(r)
    try {
      localStorage.setItem(ROLE_KEY, r)
    } catch {}
  }, [])

  const getImage = React.useCallback((id: string) => images.find((i) => i.id === id), [images])

  const addUploads = React.useCallback(async (items: { image: ReefImage; file: File }[]) => {
    setUploads((prev) => [...items.map((i) => i.image), ...prev])
    for (const { image, file } of items) {
      const { src: _s, thumb: _t, ...rest } = image
      void _s
      void _t
      try {
        await idb("readwrite", (s) => s.put({ ...rest, blob: file } satisfies UploadRecord))
      } catch {
        /* private mode / quota: the session still works */
      }
    }
  }, [])

  const updateImage = React.useCallback((img: ReefImage) => {
    if (img.provenance.source === "upload" && !ARCHIVE_IMAGES.some((a) => a.id === img.id)) {
      setUploads((prev) => prev.map((p) => (p.id === img.id ? img : p)))
      void (async () => {
        try {
          const rec = await idb<UploadRecord | undefined>("readonly", (s) => s.get(img.id))
          if (!rec) return
          const { src: _s, thumb: _t, ...rest } = img
          void _s
          void _t
          await idb("readwrite", (s) => s.put({ ...rest, blob: rec.blob } satisfies UploadRecord))
        } catch {}
      })()
      return
    }
    setArchive((prev) => prev.map((p) => (p.id === img.id ? img : p)))
    try {
      const ov = readOverrides()
      ov[img.id] = { status: img.status, detections: img.detections, provenance: img.provenance }
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(ov))
    } catch {}
  }, [])

  const resetDemo = React.useCallback(async () => {
    try {
      localStorage.removeItem(OVERRIDES_KEY)
      await idb("readwrite", (s) => s.clear())
    } catch {}
    uploads.forEach((u) => URL.revokeObjectURL(u.src))
    setUploads([])
    setArchive(ARCHIVE_IMAGES)
  }, [uploads])

  const value = React.useMemo(
    () => ({ ready, images, role, setRole, getImage, addUploads, updateImage, resetDemo }),
    [ready, images, role, setRole, getImage, addUploads, updateImage, resetDemo]
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}

export const ROLE_META: Record<Role, { label: string; can: { upload: boolean; review: boolean } }> = {
  viewer: { label: "Viewer", can: { upload: false, review: false } },
  contributor: { label: "Contributor", can: { upload: true, review: false } },
  reviewer: { label: "Reviewer", can: { upload: true, review: true } },
}
