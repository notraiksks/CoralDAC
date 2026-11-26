"use client"

/**
 * App state: photos are shared through the Supabase database and analysed by the analysis worker (store-remote.tsx).
 * V2-0476: the earlier browser-only demo mode (42 example photos, simulated results) was removed; the app needs the Supabase keys
 * (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY), also when run on a laptop (.env.local).
 */
import * as React from "react"
import { RemoteStoreProvider } from "./store-remote"
import { supabaseConfigured } from "./supabase/env"

export { useStore } from "./store-context"
export type { StoreValue, UploadMeta } from "./store-context"

export function StoreProvider({ children }: { children: React.ReactNode }) {
  if (supabaseConfigured) return <RemoteStoreProvider>{children}</RemoteStoreProvider>
  return (
    <div role="alert" className="mx-auto max-w-xl p-6 text-sm">
      <p className="font-medium">CoralDAC is not connected to its database.</p>
      <p className="text-muted-foreground">
        Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel project settings, or .env.local on a laptop) and rebuild.
      </p>
    </div>
  )
}
