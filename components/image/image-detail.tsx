"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Download, Info, MapPin, Pencil } from "lucide-react"
import { toast } from "sonner"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ClassBreakdown, ClassDot } from "@/components/class-ui"
import { ColonyPanel } from "@/components/image/colony-panel"
import { ColonyPatches } from "@/components/image/colony-patches"
import { DetectionViewer } from "@/components/image/detection-viewer"
import { DeletePhotoButton } from "@/components/upload/delete-photo"
import { STATIONS, stationById } from "@/lib/stations"
import { CLASS_META, countClasses, finalClass, HEALTH_CLASSES } from "@/lib/classes"
import { exportDetectionsCsv } from "@/lib/csv"
import { formatCoords } from "@/lib/geo"
import { parseQuadrat, quadratLabel, surveyOrder } from "@/lib/photo-order"
import { useStore } from "@/lib/store"
import type { Detection, HealthClass, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

const LOCATION_SOURCE = { station: "Station list", exif: "Photo GPS (EXIF)", manual: "Entered by hand", none: "Not given at upload" }

export function formatDate(d: string) {
  const dt = new Date(`${d.slice(0, 10)}T00:00`)
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export function ImageDetail({ id }: { id: string }) {
  const { ready, getImage, ensureDetail, images, isOwn, updateImage } = useStore()
  // colonies and outlines are loaded only for the photo being viewed (V2-0381)
  React.useEffect(() => ensureDetail(id), [id, ensureDetail])
  const router = useRouter()
  const img = getImage(id)
  const [showBoxes, setShowBoxes] = React.useState(true)
  const [showOutlines, setShowOutlines] = React.useState(true)
  // detections the filter rejected: hidden like on every other photo; the uploader can switch them on to correct one (V2-0475)
  const [othersOn, setOthersOn] = React.useState(false)
  const [minConf, setMinConf] = React.useState(0)
  const [hover, setHover] = React.useState<string | null>(null)
  // the picked colony belongs to one photo, so stepping to another photo closes its panel
  const [pickedOn, setPickedOn] = React.useState<{ photo: string; det: string } | null>(null)
  const picked = pickedOn && pickedOn.photo === id ? pickedOn.det : null
  const setPicked = React.useCallback(
    (next: string | null | ((p: string | null) => string | null)) =>
      setPickedOn((cur) => {
        const before = cur && cur.photo === id ? cur.det : null
        const det = typeof next === "function" ? next(before) : next
        return det ? { photo: id, det } : null
      }),
    [id]
  )
  const rowRefs = React.useRef<Record<string, HTMLLIElement | null>>({})
  const viewerRef = React.useRef<HTMLDivElement | null>(null)

  // neighbours: every analyzed photo of the same station, survey photos and uploads together, in survey order (V2-0475);
  // a photo without a station steps through the viewer's own photos without a station
  const siblings = React.useMemo(() => {
    if (!img) return []
    const same = images.filter((i) => (img.stationId ? i.stationId === img.stationId : i.stationId === null && isOwn(i)))
    return (same.some((i) => i.id === img.id) ? same : [...same, img]).sort(surveyOrder)
  }, [images, img, isOwn])
  const idx = siblings.findIndex((s) => s.id === id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  // fetch the neighbouring photos in the background so stepping through a station does not wait on the network
  React.useEffect(() => {
    const t = setTimeout(() => {
      for (const n of [next, prev]) {
        if (!n) continue
        ensureDetail(n.id)
        new window.Image().src = n.src
      }
    }, 600)
    return () => clearTimeout(t)
  }, [prev, next, ensureDetail])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [role=slider], [role=menu]")) return
      if (e.key === "ArrowLeft" && prev) router.push(`/images/${prev.id}`)
      if (e.key === "ArrowRight" && next) router.push(`/images/${next.id}`)
      if (e.key.toLowerCase() === "b") setShowBoxes((v) => !v)
      if (e.key.toLowerCase() === "o") setShowOutlines((v) => !v)
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
            It may have been deleted by its uploader. <Link href="/stations">Browse stations</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const station = stationById(img.stationId)
  const canEdit = isOwn(img)

  // an upload that is not analyzed yet has no display copy and no colonies: say where it is instead of a broken photo
  if (img.status && img.status !== "done") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        <h1 className="truncate text-xl font-semibold">{img.file}</h1>
        <Card size="sm">
          <CardContent className="space-y-2 text-sm">
            {img.status === "failed" ? (
              <>
                <p className="font-medium text-destructive">The analysis of this photo failed.</p>
                {img.error && <p className="break-words text-muted-foreground">{img.error}</p>}
                <p className="text-muted-foreground">Delete it and upload it again, or ask the project team.</p>
              </>
            ) : (
              <p>
                {img.status === "running"
                  ? "This photo is being analyzed. The results appear here in about a minute."
                  : img.status === "uploading"
                    ? "This photo is still uploading."
                    : "This photo is waiting for analysis. It starts as soon as the analysis server is running."}
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/uploads" />}>
            <ChevronLeft /> My uploads
          </Button>
          {canEdit && <DeletePhotoButton img={img} onDeleted={() => router.push("/uploads")} />}
        </div>
      </div>
    )
  }

  const counts = countClasses(img.detections)
  // Detections the filter rejected as not coral are not shown (Rai, V2-0385): the page is about the coral colonies.
  // The uploader can switch them on for their own photo (V2-0475), otherwise a wrong "not coral" could never be corrected.
  const nOthers = img.detections.filter((d) => finalClass(d) === "OTHERS").length
  const showOthers = canEdit && othersOn
  const visible = img.detections.filter((d) => d.detConf >= minConf && (showOthers || finalClass(d) !== "OTHERS"))
  const active = hover ?? picked

  const setClass = (det: Detection, cls: HealthClass | "OTHERS") => {
    const modelClass = det.filter === "OTHERS" || !det.health ? "OTHERS" : det.health
    const detections = img.detections.map((d) => (d.id === det.id ? { ...d, corrected: cls === modelClass ? undefined : cls } : d))
    updateImage({ ...img, detections })
    toast.success(`${det.id} set to ${CLASS_META[cls].label.toLowerCase()}`)
  }

  const setStation = (sid: string) => {
    const st = stationById(sid)
    if (!st) return
    const keepGps = img.provenance.locationSource === "exif" || img.provenance.locationSource === "manual"
    updateImage({
      ...img,
      stationId: st.id,
      lat: keepGps ? img.lat : st.lat,
      lng: keepGps ? img.lng : st.lng,
      provenance: { ...img.provenance, locationSource: keepGps ? img.provenance.locationSource : "station" },
    })
    toast.success(`Station set to ${st.name}`, { description: "The photo now counts on the map." })
  }

  // click on a box: open (or close) that colony's panel on the photo
  const pick = (did: string) => setPicked((p) => (p === did ? null : did))
  // click on a row of the list: same panel, and bring the photo back into view
  const pickFromList = (did: string) => {
    setPicked((p) => (p === did ? null : did))
    viewerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }
  const pickedIndex = picked ? visible.findIndex((d) => d.id === picked) : -1
  const pickedDet = pickedIndex >= 0 ? visible[pickedIndex] : null
  const stepColony = (delta: -1 | 1) => {
    if (!visible.length) return
    setPicked(visible[(pickedIndex + delta + visible.length) % visible.length].id)
  }
  const panelProps = pickedDet && {
    image: img,
    det: pickedDet,
    index: pickedIndex,
    total: visible.length,
    canEdit,
    onStep: stepColony,
    onClose: () => setPicked(null),
    onSetClass: (cls: HealthClass | "OTHERS") => setClass(pickedDet, cls),
  }
  return (
    <div className="mx-auto w-full max-w-[96rem] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {station?.name ?? "No station"} · {quadratLabel(img, false)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {img.file} · {formatDate(img.date)}
          </p>
        </div>
        {canEdit && <DeletePhotoButton img={img} onDeleted={() => router.push("/uploads")} />}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous photo" disabled={!prev} nativeButton={false} render={prev ? <Link href={`/images/${prev.id}`} /> : <span />}>
            <ChevronLeft />
          </Button>
          <span className="tabular px-1 text-sm text-muted-foreground" title={station ? `Photos of ${station.name}, in survey order` : "Your photos without a station"}>
            {idx + 1} / {siblings.length}
          </span>
          <Button variant="outline" size="icon" aria-label="Next photo" disabled={!next} nativeButton={false} render={next ? <Link href={`/images/${next.id}`} /> : <span />}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* top: the photo and, beside it, one patch per colony */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border bg-card px-3 py-2">
            <Label className="gap-2 text-sm font-normal">
              <Switch checked={showBoxes} onCheckedChange={setShowBoxes} /> Boxes
              <kbd className="rounded border px-1 text-[11px] text-muted-foreground">B</kbd>
            </Label>
            <Label className="gap-2 text-sm font-normal">
              <Switch checked={showOutlines} onCheckedChange={setShowOutlines} /> Outlines
              <kbd className="rounded border px-1 text-[11px] text-muted-foreground">O</kbd>
            </Label>
            {canEdit && nOthers > 0 && (
              <Label className="gap-2 text-sm font-normal" title="Detections the filter rejected as not coral. Only you see them, so you can correct one.">
                <Switch checked={othersOn} onCheckedChange={setOthersOn} /> Not coral
                <span className="tabular text-xs text-muted-foreground">({nOthers})</span>
              </Label>
            )}
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
          <div ref={viewerRef} className="scroll-my-20">
            <DetectionViewer
              image={img}
              detections={visible}
              showBoxes={showBoxes}
              showOutlines={showOutlines}
              hoverId={active}
              onHover={setHover}
              onPick={pick}
              reserveRem={8.5}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {HEALTH_CLASSES.map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <ClassDot cls={k} /> {CLASS_META[k].label}
              </span>
            ))}
            {showOthers && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0 w-3 border-t-2 border-dashed border-others" /> Not coral (only you see these; not counted)
              </span>
            )}
          </div>

        </div>
        <ColonyPatches
          image={img}
          detections={visible}
          hoverId={active}
          pickedId={picked}
          onHover={setHover}
          onPick={pick}
          detail={panelProps && pickedDet ? <ColonyPanel key={pickedDet.id} {...panelProps} className="w-full bg-muted/50 shadow-none" /> : null}
        />
      </div>

      {/* bottom: the list of detections and, at its right, the tally and the photo's details */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <Card size="sm">
            <CardHeader className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <CardTitle>Detections</CardTitle>
              <span className="tabular text-xs text-muted-foreground">
                {visible.length} {visible.length === 1 ? "colony" : "colonies"}
              </span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => exportDetectionsCsv(img)}>
                <Download /> CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {img.detections.length === 0
                    ? "No colonies were detected in this photo."
                    : minConf === 0 && nOthers === img.detections.length
                      ? `No coral colonies: the ${nOthers} detection${nOthers === 1 ? " was" : "s were"} filtered out as not coral.`
                      : "No detections match the filters above."}
                </p>
              ) : (
                <div>
                  {/* column labels, aligned with the rows */}
                  <div className="flex items-center gap-3 border-b px-(--card-spacing) pb-2 text-[11px] text-muted-foreground">
                    <span className="w-9 shrink-0">Colony</span>
                    <span className="flex-1">Health class</span>
                    <span className="w-20 text-right whitespace-nowrap" title="How sure the health classifier is">
                      Health conf.
                    </span>
                    <span className="w-24 text-right whitespace-nowrap" title="How sure the detector is that this is a coral colony">
                      Detector conf.
                    </span>
                    {canEdit && <span className="w-6" />}
                  </div>
                <ul
                  className="max-h-[22rem] overflow-y-auto overscroll-contain px-(--card-spacing) pt-1 pb-6 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,black_calc(100%-1.75rem),transparent)] [&::-webkit-scrollbar]:hidden"
                  aria-label="Detected colonies"
                >
                  {visible.map((d) => {
                    const cls = finalClass(d)
                    return (
                      <li
                        key={d.id}
                        ref={(el) => {
                          rowRefs.current[d.id] = el
                        }}
                        onMouseEnter={() => setHover(d.id)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => pickFromList(d.id)}
                        className={cn(
                          "-mx-2 flex h-10 cursor-pointer scroll-my-2 items-center gap-3 rounded-md px-2 text-sm transition-colors",
                          active === d.id ? "bg-muted" : "shadow-[inset_0_-1px_0_var(--border)]",
                          picked === d.id && "ring-1 ring-foreground/20"
                        )}
                      >
                        <span className="tabular w-9 shrink-0 text-xs text-muted-foreground">{d.id}</span>
                        <span className="flex min-w-0 flex-1 items-center gap-1.5">
                          <ClassDot cls={cls} />
                          <span className={cn("truncate", cls === "OTHERS" && "text-muted-foreground")}>{CLASS_META[cls].label}</span>
                        {d.corrected && (
                          <Tooltip>
                            <TooltipTrigger render={<Pencil className="size-3.5 text-muted-foreground" aria-label="Corrected by the uploader" />} />
                            <TooltipContent>Corrected by the uploader</TooltipContent>
                          </Tooltip>
                        )}
                        </span>
                        <span className="tabular w-20 text-right">{cls === "OTHERS" || d.corrected ? "–" : (d.healthConf ?? 0).toFixed(2)}</span>
                        <span className="tabular w-24 text-right text-muted-foreground">
                          {d.detConf.toFixed(2)}
                        </span>
                        {canEdit && (
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
                        )}
                      </li>
                    )
                  })}
                </ul>
                </div>
              )}
            </CardContent>
          </Card>

        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Colonies by health class</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassBreakdown counts={counts} />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Details</CardTitle>
              {/* overlay, so opening it does not push the cards around */}
              <Popover>
                <PopoverTrigger
                  openOnHover
                  delay={150}
                  render={<Button variant="ghost" size="sm" className="-my-1 -mr-1.5 h-7 text-muted-foreground" />}
                >
                  <Info /> Model versions
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <p className="text-xs text-muted-foreground">Models that produced the boxes and classes of this photo</p>
                  <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <Row k="Detector">{img.provenance.models.detector}</Row>
                    <Row k="Coral filter">{img.provenance.models.filter}</Row>
                    <Row k="Health">{img.provenance.models.classifier}</Row>
                  </dl>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                <Row k="Station">
                  {canEdit ? (
                    <Select value={img.stationId ?? ""} onValueChange={(v) => setStation(String(v))}>
                      <SelectTrigger size="sm" className="h-7 w-full" aria-label="Station of this photo">
                        <SelectValue>{() => station?.name ?? "Choose a station"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATIONS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : station ? (
                    <Link className="underline-offset-2 hover:underline" href={`/stations/${station.id}`}>
                      {station.name}
                    </Link>
                  ) : (
                    "Unassigned"
                  )}
                </Row>
                <Row k="Depth">{station?.depthM ? `${station.depthM} m` : "–"}</Row>
                {canEdit ? (
                  <SurveyFields key={img.id} img={img} onSave={(patch) => updateImage({ ...img, ...patch })} />
                ) : (
                  <>
                    <Row k="Transect">{img.transect || "Not given"}</Row>
                    <Row k="Quadrat">{img.quadrat ?? "Not given"}</Row>
                    <Row k="Captured">{formatDate(img.date)}</Row>
                  </>
                )}
                <Row k="Camera">{img.camera || "–"}</Row>
                <Row k="GPS">
                  <span className="tabular">{formatCoords(img.lat, img.lng)}</span>
                </Row>
                <Row k="Location from">{LOCATION_SOURCE[img.provenance.locationSource]}</Row>
                <Row k="Uploaded by">{img.provenance.uploader}</Row>
              </dl>
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

export const TRANSECTS = ["T1", "T2", "T3", "T4", "T5"]

/** the uploader's own photo: transect, quadrat number and date can be set or corrected after upload (V2-0475) */
function SurveyFields({ img, onSave }: { img: ReefImage; onSave: (patch: Pick<ReefImage, "transect" | "quadrat" | "date">) => void }) {
  const [q, setQ] = React.useState(img.quadrat != null ? String(img.quadrat) : "")
  // follow the saved value (another tab, a refused save) unless the field is being edited
  const [editing, setEditing] = React.useState(false)
  const shownQ = editing ? q : img.quadrat != null ? String(img.quadrat) : ""
  const qError = q.trim() !== "" && parseQuadrat(q) == null
  const base = { transect: img.transect, quadrat: img.quadrat, date: img.date }
  const commitQ = () => {
    setEditing(false)
    if (qError) {
      setQ(img.quadrat != null ? String(img.quadrat) : "")
      toast.error("Quadrat number not saved", { description: "Use a whole number from 1 to 999, or leave it empty." })
      return
    }
    const next = q.trim() === "" ? null : parseQuadrat(q)
    if (next !== img.quadrat) {
      onSave({ ...base, quadrat: next })
      toast.success(next == null ? "Quadrat number removed" : `Quadrat set to ${next}`)
    }
  }
  const [d, setD] = React.useState(img.date.slice(0, 10))
  const [editingDate, setEditingDate] = React.useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const commitDate = () => {
    setEditingDate(false)
    if (d === img.date.slice(0, 10)) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < "1990-01-01" || d > today || Number.isNaN(new Date(`${d}T00:00`).getTime())) {
      toast.error("Date not saved", { description: "Choose a real date, not in the future." })
      return
    }
    onSave({ ...base, date: d })
    toast.success(`Date set to ${formatDate(d)}`)
  }
  const transects = img.transect && !TRANSECTS.includes(img.transect) ? [...TRANSECTS, img.transect] : TRANSECTS
  return (
    <>
      <Row k="Transect">
        <Select
          value={img.transect || "none"}
          onValueChange={(v) => {
            const t = v === "none" ? "" : String(v)
            if (t === img.transect) return
            onSave({ ...base, transect: t })
            toast.success(t ? `Transect set to ${t}` : "Transect removed")
          }}
        >
          <SelectTrigger size="sm" className="h-7 w-full" aria-label="Transect of this photo">
            <SelectValue>{(v: string) => (v === "none" ? "Not given" : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not given</SelectItem>
            {transects.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row k="Quadrat">
        <Input
          aria-label="Quadrat number of this photo"
          aria-invalid={qError || undefined}
          inputMode="numeric"
          className="h-7"
          placeholder="Not given"
          value={shownQ}
          onFocus={() => {
            setQ(img.quadrat != null ? String(img.quadrat) : "")
            setEditing(true)
          }}
          onChange={(e) => setQ(e.target.value.replace(/\D/g, "").slice(0, 3))}
          onBlur={commitQ}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </Row>
      <Row k="Captured">
        <Input
          type="date"
          aria-label="Date the photo was taken"
          className="h-7"
          value={editingDate ? d : img.date.slice(0, 10)}
          min="1990-01-01"
          max={today}
          onFocus={() => {
            setD(img.date.slice(0, 10))
            setEditingDate(true)
          }}
          onChange={(e) => setD(e.target.value)}
          onBlur={commitDate}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </Row>
    </>
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
    <div className="mx-auto w-full max-w-[96rem] space-y-4 p-4 md:p-6">
      <Skeleton className="h-12 w-72 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="mx-auto aspect-square w-full" style={{ maxWidth: "max(20rem, calc(100svh - 8.5rem))" }} />
        <Skeleton className="h-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-48" />
        <div className="space-y-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

export type { ReefImage }
