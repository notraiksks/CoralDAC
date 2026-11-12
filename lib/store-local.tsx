"use client"

/**
 * Client-side state until the shared backend exists. No curator (Rai, 2026-11-12, V2-0361): uploads count on the map at
 * once, and only the person who uploaded a photo may correct its classes or delete it. Here "the uploader" is this browser:
 * uploads (photo blob + record) live in IndexedDB, so they survive a refresh. The example photos cannot be edited.
 */
import * as React from "react"
import { ARCHIVE_IMAGES } from "./archive"
import { StoreContext, type StoreValue } from "./store-context"
import type { ReefImage } from "./types"

const DB_NAME = "coraldac"
const STORE = "uploads"

type UploadRecord = Omit<ReefImage, "src" | "thumb"> & { blob: Blob }

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

/** Local mode (no Supabase keys): uploads live in this browser only. */
export function LocalStoreProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = React.useState<ReefImage[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let urls: string[] = []
    try {
      // class edits and review decisions on the example photos from the earlier review mode are no longer used
      localStorage.removeItem("coraldac-overrides-v2")
      localStorage.removeItem("coraldac-role")
    } catch {}
    idb<UploadRecord[]>("readonly", (s) => s.getAll())
      .catch(() => [] as UploadRecord[])
      .then((recs) => {
        const loaded = recs.map(({ blob, ...rest }) => {
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return { ...rest, src: url, thumb: url } as ReefImage
        })
        loaded.sort((a, b) => (b.provenance.uploadedAt ?? "").localeCompare(a.provenance.uploadedAt ?? ""))
        setUploads(loaded)
        setReady(true)
      })
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls = []
    }
  }, [])

  const images = React.useMemo(() => [...uploads, ...ARCHIVE_IMAGES], [uploads])

  const getImage = React.useCallback((id: string) => images.find((i) => i.id === id), [images])

  const isOwn = React.useCallback((img: ReefImage) => uploads.some((u) => u.id === img.id), [uploads])

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
  }, [])

  const removeUpload = React.useCallback(async (id: string) => {
    setUploads((prev) => {
      prev.filter((p) => p.id === id).forEach((p) => URL.revokeObjectURL(p.src))
      return prev.filter((p) => p.id !== id)
    })
    try {
      await idb("readwrite", (s) => s.delete(id))
    } catch {}
  }, [])

  const clearUploads = React.useCallback(async () => {
    try {
      await idb("readwrite", (s) => s.clear())
    } catch {}
    uploads.forEach((u) => URL.revokeObjectURL(u.src))
    setUploads([])
  }, [uploads])

  const value = React.useMemo<StoreValue>(
    () => ({
      remote: false,
      ready,
      images,
      myUploads: uploads,
      user: null,
      getImage,
      isOwn,
      addUploads,
      uploadPhotos: async () => ({ sent: 0, errors: ["The shared database is not configured."] }),
      updateImage,
      removeUpload,
      clearUploads,
      signIn: async () => "Sign-in is not configured.",
      signUp: async () => "Sign-up is not configured.",
      signOut: async () => {},
    }),
    [ready, images, uploads, getImage, isOwn, addUploads, updateImage, removeUpload, clearUploads]
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
