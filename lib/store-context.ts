"use client"

import * as React from "react"
import type { LocationSource, ReefImage } from "./types"

/** What the upload page sends for one photo (location is optional). */
export interface UploadMeta {
  stationId: string | null
  lat: number | null
  lng: number | null
  locationSource: LocationSource
  takenOn: string | null
  transect: string | null
  quadrat: number | null
  camera: string | null
  exifLat: number | null
  exifLng: number | null
}

export interface StoreValue {
  /** true when photos are shared through the database (Supabase configured); false = this browser only */
  remote: boolean
  ready: boolean
  /** photos that count on the map and the pages: finished uploads + the example archive */
  images: ReefImage[]
  /** the signed-in visitor's own uploads in every state (or this browser's uploads in local mode) */
  myUploads: ReefImage[]
  user: { id: string; email: string | null } | null
  getImage: (id: string) => ReefImage | undefined
  /** loads a photo's full colonies and outlines (lists carry only summaries); call it on the photo's page */
  ensureDetail: (id: string) => void
  /** only the uploader may correct, assign a station or delete */
  isOwn: (img: ReefImage) => boolean
  /** local mode: photo + results stored in this browser */
  addUploads: (items: { image: ReefImage; file: File }[]) => Promise<void>
  /** shared mode: sends the photos for analysis on the GPU worker */
  uploadPhotos: (items: { file: File; meta: UploadMeta }[], onProgress?: (done: number) => void) => Promise<{ sent: number; errors: string[] }>
  updateImage: (img: ReefImage) => void
  removeUpload: (id: string) => Promise<void>
  clearUploads: () => Promise<void>
  /** signs in with an account made by the project (username + password, no e-mail); returns an error message or null */
  signIn: (username: string, password: string) => Promise<string | null>
  /** creates an account (username + password; e-mail optional, kept only as contact); returns an error message or null */
  signUp: (username: string, password: string, email?: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const StoreContext = React.createContext<StoreValue | null>(null)

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}
