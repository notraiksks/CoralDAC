"use client"

import { useDocMode } from "@/lib/doc-mode"
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ExternalLink, FlaskConical, Inbox, MapPinOff, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ClassBar, ClassBreakdown } from "@/components/class-ui"
import { DetectionViewer } from "@/components/image/detection-viewer"
import { formatDate } from "@/components/image/image-detail"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { STATIONS, stationById } from "@/lib/archive"
import { countClasses, totalOf } from "@/lib/classes"
import { formatCoords } from "@/lib/geo"
import { useStore } from "@/lib/store"
import type { ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Reason codes for rejection (SRS FR-4). */
export const REJECT_REASONS = [
  "Blurry or too dark",
  "Not a top-down quadrat photo",
  "Location looks wrong",
  "Duplicate of an existing photo",
  "Detections unusable",
  "Other",
] as const

const CHECKS = ["Photo is sharp and well lit", "Location is plausible for this station", "Boxes and classes look reasonable"]

export function ReviewQueue() {
  const { images, updateImage } = useStore()
  const [tab, setTab] = React.useState<"pending" | "decided">("pending")
  const pending = images.filter((i) => i.status === "pending")
  const decided = images.filter((i) => i.provenance.review).sort((a, b) => (b.provenance.review!.at > a.provenance.review!.at ? 1 : -1))
  const list = tab === "pending" ? pending : decided
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selected = list.find((i) => i.id === selectedId) ?? list[0] ?? null

  const move = (delta: number) => {
    if (!selected) return
    const i = list.findIndex((x) => x.id === selected.id)
    const next = list[Math.min(list.length - 1, Math.max(0, i + delta))]
    if (next) setSelectedId(next.id)
  }

  const decide = (img: ReefImage, decision: "approved" | "rejected", extra: { reason?: string; note?: string; stationId?: string | null }) => {
    const i = list.findIndex((x) => x.id === img.id)
    const st = stationById(extra.stationId ?? img.stationId)
    const at = new Date().toISOString().slice(0, 16)
    updateImage({
      ...img,
      status: decision,
      stationId: st?.id ?? img.stationId,
      lat: st && st.id !== img.stationId ? st.lat : img.lat,
      lng: st && st.id !== img.stationId ? st.lng : img.lng,
      provenance: { ...img.provenance, review: { by: "Reviewer (demo)", at, decision, reason: extra.reason, note: extra.note || undefined } },
    })
    toast(decision === "approved" ? "Approved" : `Rejected: ${extra.reason}`, {
      action: {
        label: "Undo",
        onClick: () => updateImage(img),
      },
    })
    const following = list[i + 1] ?? list[i - 1]
    setSelectedId(following && following.id !== img.id ? following.id : null)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
      <PageHeader
        title="Review queue"
        description="Uploads count on the map as soon as they are analyzed. Approve them, correct their classes, or reject them with a reason to take them off the map."
        actions={
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
            <Kbd>J</Kbd>/<Kbd>K</Kbd> move · <Kbd>A</Kbd> approve · <Kbd>R</Kbd> reject
          </span>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Waiting <Badge variant="secondary" className="tabular ml-1">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="decided">
            Decided <Badge variant="secondary" className="tabular ml-1">{decided.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>{tab === "pending" ? "Nothing to review" : "No decisions yet"}</EmptyTitle>
            <EmptyDescription>
              {tab === "pending" ? "New uploads will appear here." : "Approved and rejected uploads will be listed here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <ul className="space-y-1.5 lg:max-h-[calc(100svh-15rem)] lg:overflow-y-auto lg:pr-1" aria-label="Uploads">
            {list.map((img) => {
              const c = countClasses(img.detections)
              const active = selected?.id === img.id
              return (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(img.id)}
                    aria-current={active || undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active && "border-primary bg-accent/40"
                    )}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={img.thumb} alt="" fill sizes="56px" className="object-cover" unoptimized />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{stationById(img.stationId)?.name ?? "No station"}</span>
                        {!img.stationId && <MapPinOff className="size-3.5 shrink-0 text-dc" aria-label="No station assigned" />}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {img.file} · {formatDate(img.date)}
                      </span>
                      <ClassBar counts={c} height="h-1" />
                    </span>
                    {tab === "decided" && <StatusDot status={img.status} />}
                  </button>
                </li>
              )
            })}
          </ul>
          {selected && <ReviewPanel key={selected.id} img={selected} onDecide={decide} onMove={move} readOnly={tab === "decided"} />}
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: ReefImage["status"] }) {
  return status === "approved" ? <Check className="size-4 text-lc" aria-label="Approved" /> : <X className="size-4 text-destructive" aria-label="Rejected" />
}

function ReviewPanel({
  img,
  onDecide,
  onMove,
  readOnly,
}: {
  img: ReefImage
  onDecide: (img: ReefImage, d: "approved" | "rejected", extra: { reason?: string; note?: string; stationId?: string | null }) => void
  onMove: (delta: number) => void
  readOnly: boolean
}) {
  const docMode = useDocMode()
  const [checks, setChecks] = React.useState<boolean[]>(CHECKS.map(() => false))
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState<string>("")
  const [note, setNote] = React.useState("")
  const [stationId, setStationId] = React.useState<string | null>(img.stationId)
  const c = countClasses(img.detections)
  const others = img.detections.length - totalOf(c)
  const needsStation = !stationId
  const canApprove = !needsStation

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [role=listbox], [role=combobox]")) return
      const k = e.key.toLowerCase()
      if (k === "j") onMove(1)
      else if (k === "k") onMove(-1)
      else if (!readOnly && k === "a" && canApprove) onDecide(img, "approved", { stationId })
      else if (!readOnly && k === "r") setRejecting(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [img, onDecide, onMove, readOnly, canApprove, stationId])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-2">
        <DetectionViewer image={img} detections={img.detections} />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {img.file} · uploaded by {img.provenance.uploader}
            {img.provenance.uploadedAt ? ` on ${formatDate(img.provenance.uploadedAt)}` : ""}
          </span>
          {img.provenance.simulated && !docMode && (
            <Badge variant="outline" className="border-dashed">
              <FlaskConical className="text-pb" /> Simulated classes
            </Badge>
          )}
          <Button variant="link" size="sm" className="ml-auto" nativeButton={false} render={<Link href={`/images/${img.id}`} />}>
            Open full view <ExternalLink />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Model result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ClassBreakdown counts={c} />
            <p className="text-xs text-muted-foreground">
              {totalOf(c)} colonies counted · {others} filtered as not coral
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="tabular text-muted-foreground">{formatCoords(img.lat, img.lng)}</p>
            {readOnly ? (
              <p>{stationById(img.stationId)?.name ?? "No station"}</p>
            ) : (
              <>
                <Label htmlFor="rv-station" className={cn(needsStation && "text-dc")}>
                  {needsStation ? "Assign a station to approve" : "Station"}
                </Label>
                <Select value={stationId ?? ""} onValueChange={(v) => setStationId(String(v))}>
                  <SelectTrigger id="rv-station" className="w-full">
                    <SelectValue placeholder="Choose a station">{(v: string) => stationById(v)?.name ?? "Choose a station"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </CardContent>
        </Card>

        {readOnly ? (
          <Card size="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Decision</CardTitle>
              <StatusBadge status={img.status} />
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                {img.provenance.review?.by} · {img.provenance.review?.at.replace("T", " ")}
              </p>
              {img.provenance.review?.reason && <p>Reason: {img.provenance.review.reason}</p>}
              {img.provenance.review?.note && <p className="text-muted-foreground">“{img.provenance.review.note}”</p>}
            </CardContent>
          </Card>
        ) : (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CHECKS.map((label, i) => (
                <Label key={label} className="items-start gap-2.5 font-normal">
                  <Checkbox checked={checks[i]} onCheckedChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? !!v : x)))} className="mt-0.5" />
                  {label}
                </Label>
              ))}

              {rejecting ? (
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="rv-reason">Reason for rejecting</Label>
                  <Select value={reason} onValueChange={(v) => setReason(String(v))}>
                    <SelectTrigger id="rv-reason" className="w-full">
                      <SelectValue placeholder="Choose a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REJECT_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Note for the uploader (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" className="flex-1" disabled={!reason} onClick={() => onDecide(img, "rejected", { reason, note })}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 border-t pt-3">
                  <Button variant="outline" className="flex-1" onClick={() => setRejecting(true)}>
                    <X /> Reject
                  </Button>
                  <Button className="flex-1" disabled={!canApprove} onClick={() => onDecide(img, "approved", { stationId })}>
                    <Check /> Approve
                  </Button>
                </div>
              )}
              {!checks.every(Boolean) && !rejecting && <p className="text-xs text-muted-foreground">The checklist is a reminder; it does not block approval.</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
