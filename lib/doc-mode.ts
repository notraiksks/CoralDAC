"use client"

import * as React from "react"

/**
 * Documentation mode (Rai, 2026-11-10; temporary): hides the "Simulated" / "Demo" markers so interface screenshots for the thesis
 * stay clean. Off by default for every visitor. Turn on with `?doc=1` (kept for the browser tab's session), off with `?doc=0`.
 * Figures taken this way still show simulated Stage 2 classes and must be captioned as an interface demonstration.
 * Remove this file and its uses once the real model server is connected.
 */
const KEY = "coraldac-doc-mode"

function read(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("doc")
    if (q === "1") sessionStorage.setItem(KEY, "1")
    if (q === "0") sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === "1"
  } catch {
    return new URLSearchParams(window.location.search).get("doc") === "1"
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb)
  return () => window.removeEventListener("popstate", cb)
}

export function useDocMode(): boolean {
  return React.useSyncExternalStore(subscribe, read, () => false)
}
