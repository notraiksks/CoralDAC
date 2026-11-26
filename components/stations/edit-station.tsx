"use client"

/**
 * V2-0481: user-created stations. Any signed-in user creates one (name + depth; the place comes from the photos' GPS or the typed
 * coordinates); only the creator renames it, changes its depth, or deletes it while no photo uses it. The database enforces all of
 * this (supabase 0010); these forms only explain it.
 */
import * as React from "react"
import { useRouter } from "next/navigation"
import { MapPinPlus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCoords } from "@/lib/geo"
import { depthKind } from "@/lib/stations"
import { useStore } from "@/lib/store"
import type { Station } from "@/lib/types"

/** name 3-60 characters, depth 0-60 m (the database checks the same) */
export function checkStation(name: string, depth: string): string | null {
  const n = name.trim()
  if (n.length < 3 || n.length > 60) return "Name: 3 to 60 characters."
  const d = Number(depth.replace(",", "."))
  if (depth.trim() === "" || !Number.isFinite(d) || d < 0 || d > 60) return "Depth: a number of metres from 0 to 60."
  return null
}

function StationFields({ name, depth, setName, setDepth, idPrefix }: { name: string; depth: string; setName: (v: string) => void; setDepth: (v: string) => void; idPrefix: string }) {
  const d = Number(depth.replace(",", "."))
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Station name</Label>
        <Input id={`${idPrefix}-name`} placeholder="e.g. Balatero Reef" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-depth`}>Depth (m)</Label>
        <Input id={`${idPrefix}-depth`} inputMode="decimal" placeholder="e.g. 7.5" value={depth} onChange={(e) => setDepth(e.target.value)} />
        {depth.trim() !== "" && Number.isFinite(d) && d >= 0 && d <= 60 && <p className="text-xs text-muted-foreground">{depthKind(d)}</p>}
      </div>
    </div>
  )
}

/** On the upload page: create a station at the given point for the photos that have no station nearby. */
export function CreateStationCard({ point, count, onCreated }: { point: { lat: number; lng: number }; count: number; onCreated: (s: Station) => void }) {
  const { createStation } = useStore()
  const [name, setName] = React.useState("")
  const [depth, setDepth] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const submit = async () => {
    const bad = checkStation(name, depth)
    if (bad) return setError(bad)
    setBusy(true)
    const res = await createStation({ name, depthM: Number(depth.replace(",", ".")), lat: point.lat, lng: point.lng })
    setBusy(false)
    if (res.error || !res.station) return setError(res.error ?? "The station was not created.")
    setError(null)
    toast.success(`Station "${res.station.name}" created`, { description: "It is on the map now." })
    onCreated(res.station)
  }
  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="flex items-start gap-2 text-sm">
        <MapPinPlus className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          {count} photo{count === 1 ? " is" : "s are"} not within 1 km of any station. Create a new station at{" "}
          <span className="tabular">{formatCoords(point.lat, point.lng)}</span> for {count === 1 ? "it" : "them"}, or leave{" "}
          {count === 1 ? "it" : "them"} without a station for now.
        </p>
      </div>
      <StationFields name={name} depth={depth} setName={setName} setDepth={setDepth} idPrefix="new-station" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" disabled={busy} onClick={submit}>
        <MapPinPlus /> {busy ? "Creating…" : "Create station"}
      </Button>
    </div>
  )
}

/** On a station page, for its creator: rename, change the depth, or delete while it has no photos. */
export function EditStationButton({ station, hasPhotos }: { station: Station; hasPhotos: boolean }) {
  const { updateStation, deleteStation } = useStore()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(station.name)
  const [depth, setDepth] = React.useState(station.depthM != null ? String(station.depthM) : "")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const onOpen = (o: boolean) => {
    if (busy) return
    if (o) {
      setName(station.name)
      setDepth(station.depthM != null ? String(station.depthM) : "")
      setError(null)
    }
    setOpen(o)
  }
  const save = async () => {
    const bad = checkStation(name, depth)
    if (bad) return setError(bad)
    setBusy(true)
    const msg = await updateStation(station.id, { name, depthM: Number(depth.replace(",", ".")) })
    setBusy(false)
    if (msg) return setError(msg)
    setOpen(false)
    toast.success("Station saved")
  }
  const remove = async () => {
    setBusy(true)
    const msg = await deleteStation(station.id)
    setBusy(false)
    if (msg) return setError(msg)
    setOpen(false)
    toast.success(`Station "${station.name}" deleted`)
    router.push("/stations")
  }
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil /> Edit station
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {station.name}</DialogTitle>
          <DialogDescription>You created this station, so only you can change it. Its place on the map stays the same.</DialogDescription>
        </DialogHeader>
        <StationFields name={name} depth={depth} setName={setName} setDepth={setDepth} idPrefix="edit-station" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive"
            disabled={busy || hasPhotos}
            title={hasPhotos ? "Move or delete its photos first" : undefined}
            onClick={remove}
          >
            <Trash2 /> {hasPhotos ? "Has photos: cannot delete" : "Delete station"}
          </Button>
          <div className="flex gap-2">
            <DialogClose render={<Button variant="outline" disabled={busy} />}>Cancel</DialogClose>
            <Button disabled={busy} onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
