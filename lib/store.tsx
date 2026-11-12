"use client"

/**
 * App state. With the Supabase keys set (Vercel), photos are shared through the database and analysed by the GPU worker
 * (store-remote.tsx); without them the earlier browser-only mode is used (store-local.tsx), e.g. for local development.
 */
import * as React from "react"
import { LocalStoreProvider } from "./store-local"
import { RemoteStoreProvider } from "./store-remote"
import { supabaseConfigured } from "./supabase/env"

export { useStore } from "./store-context"
export type { StoreValue, UploadMeta } from "./store-context"

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return supabaseConfigured ? <RemoteStoreProvider>{children}</RemoteStoreProvider> : <LocalStoreProvider>{children}</LocalStoreProvider>
}
