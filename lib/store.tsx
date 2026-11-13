"use client"

/**
 * App state. With the Supabase keys set (Vercel), photos are shared through the database and analysed by the GPU worker
 * (store-remote.tsx); without them the earlier browser-only mode is used (store-local.tsx), e.g. for local development.
 */
import * as React from "react"
// the local mode carries the 42 example photos (~230 KB): loaded only without Supabase keys, never in the shared build
const LocalStoreProvider = React.lazy(() => import("./store-local").then((m) => ({ default: m.LocalStoreProvider })))
import { RemoteStoreProvider } from "./store-remote"
import { supabaseConfigured } from "./supabase/env"

export { useStore } from "./store-context"
export type { StoreValue, UploadMeta } from "./store-context"

export function StoreProvider({ children }: { children: React.ReactNode }) {
  if (supabaseConfigured) return <RemoteStoreProvider>{children}</RemoteStoreProvider>
  return (
    <React.Suspense fallback={null}>
      <LocalStoreProvider>{children}</LocalStoreProvider>
    </React.Suspense>
  )
}
