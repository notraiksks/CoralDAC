"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Download, FlaskConical, MapPin, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ClassBadge, ClassBreakdown, ClassDot } from "@/components/class-ui"
import { DetectionViewer } from "@/components/image/detection-viewer"
import { StatusBadge } from "@/components/status-badge"
import { stationById } from "@/lib/archive"
import { CLASS_META, countClasses, finalClass, HEALTH_CLASSES } from "@/lib/classes"
import { exportDetectionsCsv } from "@/lib/csv"
import { formatCoords } from "@/lib/geo"
import { ROLE_META, useStore } from "@/lib/store"
import type { Detection, HealthClass, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

const LOCATION_SOURCE = { station: "Station list", exif: "Photo GPS (EXIF)", manual: "Entered by hand" }

export function formatDate(d: string) {
  const dt = new Date(`${d.slice(0, 10)}T00:00`)
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export function ImageDetail({ id }: { id: string }) {
  const { ready, getImage, images, role, updateImage } = useStore()
  const router = useRouter()
  const img = getImage(id)
  const [showBoxes, setShowBoxes] = React.useState(true)
  const [showOthers, setShowOthers] = React.useState(true)
  const [minConf, setMinConf] = React.useState(0)
  const [hover, setHover] = React.useState<string | null>(null)
  const [picked, setPicked] = React.useState<string | null>(null)
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({})

  // neighbours within the same station, in archive order
  const siblings = React.useMemo(
    () => (img ? images.filter((i) => i.stationId === img.stationId && i.status === img.status) : []),
    [images, img]
  )
  const idx = siblings.findIndex((s) => s.id === id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [role=slider], [role=menu]")) return
      if (e.key === "ArrowLeft" && prev) router.push(`/images/${prev.id}`)
      if (e.key === "ArrowRight" && next) router.push(`/images/${next.id}`)
      if (e.key.toLowerCase() === "b") setShowBoxes((v) => !v)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next, router])

  if (!img) {
    if (!ready) return <DetailSkeleton />
    return (
      <Empty className="m-6 border">
        <EmptyHeader>
          <EmptyTitle>Photo not found</EmptyTitle>
          <EmptyDescription>
            It may have been removed from this browser. <Link href="/stations">Browse stations</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const station = stationById(img.stationId)
  const counts = countClasses(img.detections)
  const visible = img.detections.filter((d) => d.detConf >= minConf && (showOthers || finalClass(d) !== "OTHERS"))
  const others = img.detections.filter((d) => finalClass(d) === "OTHERS").length
  const active = hover ?? picked
  const canEdit = ROLE_META[role].can.review

  const setClass = (det: Detection, cls: HealthClass | "OTHERS") => {
    const modelClass = det.filter === "OTHERS" || !det.health ? "OTHERS" : det.health
    const detections = img.detections.map((d) => (d.id === det.id ? { ...d, reviewed: cls === modelClass ? undefined : cls } : d))
    updateImage({ ...img, detections })
    toast.success(`${det.id} set to ${CLASS_META[cls].label.toLowerCase()}`)
  }

  const pick = (did: string) => {
    setPicked((p) => (p === did ? null : did))
    rowRefs.current[did]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {station?.name ?? "Unassigned"} · {img.transect} · Quadrat {img.quadrat ?? "–"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {img.file} · {formatDate(img.date)}
          </p>
        </div>
        <StatusBadge status={img.status} />
        {img.provenance.simulated && (
          <Tooltip>
            <TooltipTrigger render={<Badge variant="outline" className="border-dashed text-muted-foreground" />}>
              <FlaskConical className="text-pb" /> Simulated classes
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Boxes come from the detector; the coral filter and health classes are simulated until Stage 2 is trained.
            </TooltipContent>
          </Tooltip>
        )}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous photo (←)" disabled={!prev} nativeButton={false} render={prev ? <Link href={`/images/${prev.id}`} /> : <span />}>
            <ChevronLeft />
          </Button>
          <span className="tabular px-1 text-sm text-muted-foreground">
            {idx + 1} / {siblings.length}
          </span>
          <Button variant="outline" size="icon" aria-label="Next photo (→)" disabled={!next} nativeButton={false} render={next ? <Link href={`/images/${next.id}`} /> : <span />}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border bg-card px-3 py-2">
            <Label className="gap-2 text-sm font-normal">
              <Switch checked={showBoxes} onCheckedChange={setShowBoxes} /> Boxes
              <kbd className="rounded border px-1 text-[11px] text-muted-foreground">B</kbd>
            </Label>
            <Label className="gap-2 text-sm font-normal">
              <Switch checked={showOthers} onCheckedChange={setShowOthers} /> Not-coral ({others})
            </Label>
            <div className="flex min-w-56 flex-1 items-center gap-3">
              <span className="text-sm whitespace-nowrap text-muted-foreground">Detector confidence ≥</span>
              <Slider
                aria-label="Minimum detector confidence"
                className="flex-1"
                min={0}
                max={0.95}
                step={0.05}
                value={[minConf]}
                onValueChange={(v) => setMinConf(Array.isArray(v) ? v[0] : (v as number))}
              />
              <span className="tabular w-9 text-right text-sm">{minConf.toFixed(2)}</span>
            </div>
          </div>
          <DetectionViewer image={img} detections={visible} showBoxes={showBoxes} hoverId={active} onHover={setHover} onPick={pick} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {HEALTH_CLASSES.map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <ClassDot cls={k} /> {CLASS_META[k].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0 w-3 border-t-2 border-dashed border-others" /> Not coral (filtered)
            </span>
            <span className="ml-auto">
              Showing {visible.length} of {img.detections.length} detections
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Colonies by health class</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassBreakdown counts={counts} />
            </CardContent>
          </Card>

          <Card size="sm" className="gap-0 pb-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Detections</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportDetectionsCsv(img)}>
                <Download /> CSV
              </Button>
            </CardHeader>
            <ScrollArea className="h-72 border-t">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="py-2 text-left font-medium">Class</th>
                    <th className="py-2 text-right font-medium">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">Class conf.</TooltipTrigger>
                        <TooltipContent>Confidence of the health classifier (or of the filter for not-coral)</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Det.</th>
                    {canEdit && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((d) => {
                    const cls = finalClass(d)
                    return (
                      <tr
                        key={d.id}
                        ref={(el) => {
                          rowRefs.current[d.id] = el
                        }}
                        onMouseEnter={() => setHover(d.id)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => setPicked((p) => (p === d.id ? null : d.id))}
                        className={cn("cursor-pointer border-b last:border-0", active === d.id && "bg-muted")}
                      >
                        <td className="tabular px-3 py-1.5 text-muted-foreground">{d.id}</td>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1.5">
                            <ClassBadge cls={cls} />
                            {d.reviewed && (
                              <Tooltip>
                                <TooltipTrigger render={<Pencil className="size-3.5 text-muted-foreground" aria-label="Edited by reviewer" />} />
                                <TooltipContent>Changed by a reviewer</TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                        </td>
                        <td className="tabular py-1.5 text-right">{(cls === "OTHERS" ? d.filterConf : d.healthConf ?? 0).toFixed(2)}</td>
                        <td className="tabular px-3 py-1.5 text-right text-muted-foreground">{d.detConf.toFixed(2)}</td>
                        {canEdit && (
                          <td className="pr-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Change class of ${d.id}`} onClick={(e) => e.stopPropagation()} />}>
                                <Pencil />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Correct the class</DropdownMenuLabel>
                                  <DropdownMenuRadioGroup value={cls} onValueChange={(v) => setClass(d, v as HealthClass | "OTHERS")}>
                                    {[...HEALTH_CLASSES, "OTHERS" as const].map((k) => (
                                      <DropdownMenuRadioItem key={k} value={k}>
                                        <ClassDot cls={k} /> {CLASS_META[k].label}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                <Row k="Station">
                  {station ? (
                    <Link className="underline-offset-2 hover:underline" href={`/stations/${station.id}`}>
                      {station.name}
                    </Link>
                  ) : (
                    "Unassigned"
                  )}
                </Row>
                <Row k="Depth">{station?.depthM ? `${station.depthM} m` : "–"}</Row>
                <Row k="Captured">{formatDate(img.date)}</Row>
                <Row k="Camera">{img.camera || "–"}</Row>
                <Row k="GPS">
                  <span className="tabular">{formatCoords(img.lat, img.lng)}</span>
                </Row>
                <Row k="Location from">{LOCATION_SOURCE[img.provenance.locationSource]}</Row>
                <Row k="Uploaded by">{img.provenance.uploader}</Row>
                {img.provenance.review && (
                  <Row k="Review">
                    {img.provenance.review.decision === "approved" ? "Approved" : "Rejected"} by {img.provenance.review.by}
                    {img.provenance.review.reason ? ` · ${img.provenance.review.reason}` : ""}
                  </Row>
                )}
              </dl>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Model versions</summary>
                <dl className="mt-2 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5">
                  <Row k="Detector">{img.provenance.models.detector}</Row>
                  <Row k="Coral filter">{img.provenance.models.filter}</Row>
                  <Row k="Health">{img.provenance.models.classifier}</Row>
                </dl>
              </details>
              {station && (
                <Button variant="outline" size="sm" className="mt-4 w-full" nativeButton={false} render={<Link href={`/?station=${station.id}`} />}>
                  <MapPin /> Show on map
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export type { ReefImage }
