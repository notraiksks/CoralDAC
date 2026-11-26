"use client"

import * as React from "react"
import type { LocationSource, ReefImage, Station } from "./types"

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
  ready: boolean
  /** every monitoring station: the 6 survey stations and the ones users created (V2-0481) */
  stations: Station[]
  /** true once the station list has been read from the database (before that: the 6 survey stations) */
  stationsReady: boolean
  stationById: (id: string | null | undefined) => Station | undefined
  /** signed-in users create a station for photos far from every other; returns the station or a message */
  createStation: (st: { name: string; depthM: number; lat: number; lng: number }) => Promise<{ station?: Station; error?: string }>
  /** the creator only: rename or change the depth; returns a message or null */
  updateStation: (id: string, patch: { name: string; depthM: number }) => Promise<string | null>
  /** the creator only, and only while no photo uses it; returns a message or null */
  deleteStation: (id: string) => Promise<string | null>
  /** photos that count on the map and the pages: the survey photos and finished uploads */
  images: ReefImage[]
  /** the signed-in visitor's own uploads in every state */
  myUploads: ReefImage[]
  user: { id: string; email: string | null } | null
  getImage: (id: string) => ReefImage | undefined
  /** loads a photo's full colonies and outlines (lists carry only summaries); call it on the photo's page */
  ensureDetail: (id: string) => void
  /** only the uploader may correct, assign a station or delete */
  isOwn: (img: ReefImage) => boolean
  /** sends the photos for analysis; ids = the new photos, in the order sent */
  uploadPhotos: (
    items: { file: File; meta: UploadMeta }[],
    onProgress?: (done: number) => void
  ) => Promise<{ sent: number; errors: string[]; ids: string[] }>
  updateImage: (img: ReefImage) => void
  removeUpload: (id: string) => Promise<void>
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
