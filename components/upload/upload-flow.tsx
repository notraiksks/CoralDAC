"use client"

import { useDocMode } from "@/lib/doc-mode"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleSlash, FlaskConical, ImagePlus, Loader2, MapPin, Navigation, PenLine, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClassBar } from "@/components/class-ui"
import { DetectionViewer } from "@/components/image/detection-viewer"
import { PageHeader } from "@/components/page-header"
import { STATIONS, stationById } from "@/lib/archive"
import { CLASS_META, countClasses, HEALTH_CLASSES, totalOf } from "@/lib/classes"
import { apiConfigured, runInference, type InferenceResult } from "@/lib/classify"
import { formatCoords, haversineKm, inPhilippines, nearestStation } from "@/lib/geo"
import {
  ACCEPT_BATCH,
  expandZip,
  formatBytes,
  isZip,
  MAX_BATCH_IMAGES,
  readDimensions,
  readExif,
  validateImageFile,
  type ExifInfo,
} from "@/lib/ingest"
import { useStore } from "@/lib/store"
import { MY_NAME } from "@/components/upload/my-uploads"
import { SignInCard } from "@/components/auth/sign-in-card"
import type { LocationSource, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Item {
  key: string
  file: File
  url: string
  width: number
  height: number
  exif: ExifInfo
  quadrat: string
  result?: InferenceResult
}

const STEPS = ["Photos", "Location", "Check results"] as const
/** an EXIF/manual point this close to a station is assigned to it */
const SNAP_KM = 1

export function UploadFlow() {
  const router = useRouter()
  const { addUploads, remote, user, uploadPhotos } = useStore()
  const docMode = useDocMode()
  const [step, setStep] = React.useState(0)
  const [items, setItems] = React.useState<Item[]>([])
  const [busy, setBusy] = React.useState<{ done: number; total: number; label: string } | null>(null)
  const [errors, setErrors] = React.useState<string[]>([])

  // location (shared by the batch)
  const [source, setSource] = React.useState<LocationSource>("station")
  const [stationId, setStationId] = React.useState<string>("")
  const [lat, setLat] = React.useState("")
  const [lng, setLng] = React.useState("")
  const [date, setDate] = React.useState("")
  const [transect, setTransect] = React.useState("T1")

  const withGps = items.filter((i) => i.exif.lat != null).length

  React.useEffect(() => {
    return () => items.forEach((i) => URL.revokeObjectURL(i.url))
    // revoke only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addFiles(list: FileList | File[]) {
    const incoming: File[] = []
    const errs: string[] = []
    for (const f of Array.from(list)) {
      if (isZip(f)) {
        try {
          const { files, skipped } = await expandZip(f)
          incoming.push(...files)
          errs.push(...skipped)
        } catch {
          errs.push(`${f.name}: could not open the ZIP file`)
        }
      } else incoming.push(f)
    }
    const room = MAX_BATCH_IMAGES - items.length
    if (incoming.length > room) errs.push(`Only ${MAX_BATCH_IMAGES} photos fit in one batch, so ${incoming.length - room} were skipped`)
    const accepted = incoming.slice(0, Math.max(0, room))
    const next: Item[] = []
    setBusy({ done: 0, total: accepted.length, label: "Reading photos" })
    for (const [n, file] of accepted.entries()) {
      const err = validateImageFile(file)
      if (err) {
        errs.push(err)
      } else {
        try {
          const [exif, dims] = await Promise.all([readExif(file), readDimensions(file)])
          next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file, url: URL.createObjectURL(file), width: dims.width, height: dims.height, exif, quadrat: "" })
        } catch {
          errs.push(`${file.name}: could not be read as an image`)
        }
      }
      setBusy({ done: n + 1, total: accepted.length, label: "Reading photos" })
    }
    setBusy(null)
    setErrors(errs)
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.key))
      const merged = [...prev, ...next.filter((n) => !seen.has(n.key))]
      const firstDate = merged.find((m) => m.exif.date)?.exif.date
      if (firstDate && !date) setDate(firstDate)
      if (merged.some((m) => m.exif.lat != null) && prev.length === 0) setSource("exif")
      return merged
    })
  }

  const remove = (key: string) =>
    setItems((prev) => {
      const it = prev.find((p) => p.key === key)
      if (it) URL.revokeObjectURL(it.url)
      return prev.filter((p) => p.key !== key)
    })

  // resolved location for an item; location is optional (Rai, 2026-11-10): without one the photo is saved unassigned
  function locate(it: Item): Located {
    const none: Located = { lat: null, lng: null, stationId: null, source: "none" }
    if (source === "none") return none
    if (source === "station") {
      const st = stationById(stationId)
      return st ? { lat: st.lat, lng: st.lng, stationId: st.id, source } : none
    }
    if (source === "manual" && (manualError || lat === "" || lng === "")) return none
    const p = source === "exif" ? (it.exif.lat != null ? { lat: it.exif.lat, lng: it.exif.lng! } : null) : { lat: Number(lat), lng: Number(lng) }
    if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return none
    const near = nearestStation(STATIONS, p.lat, p.lng)
    // stations at one site can share a GPS point (Deep / Shallow): then GPS cannot decide, a person must
    const tied = near ? STATIONS.filter((s) => Math.abs(haversineKm(p.lat, p.lng, s.lat, s.lng) - near.km) < 0.05).length > 1 : false
    return { ...p, stationId: near && near.km <= SNAP_KM && !tied ? near.station.id : null, source }
  }

  const manualError = (() => {
    if (source !== "manual") return null
    const la = Number(lat)
    const lo = Number(lng)
    if (lat === "" || lng === "") return "Enter both latitude and longitude."
    if (!Number.isFinite(la) || la < -90 || la > 90) return "Latitude must be between −90 and 90."
    if (!Number.isFinite(lo) || lo < -180 || lo > 180) return "Longitude must be between −180 and 180."
    return null
  })()
  // a hint only, never blocking
  const manualHint =
    source === "manual" && !manualError && lat !== "" && lng !== "" && !inPhilippines(Number(lat), Number(lng))
      ? "That point is outside the Philippines. Check the signs and decimal points."
      : null

  // only coordinates typed in but malformed block the step; an empty location is allowed
  const locationOk = !(source === "manual" && manualError && (lat !== "" || lng !== ""))
  const unassigned = items.filter((it) => !locate(it).stationId).length

  // shared mode: the photos go to storage and the GPU worker analyses them; results appear live on "My uploads"
  async function sendForAnalysis() {
    setBusy({ done: 0, total: items.length, label: "Uploading photos for analysis" })
    const payload = items.map((it) => {
      const loc = locate(it)
      return {
        file: it.file,
        meta: {
          stationId: loc.stationId,
          lat: loc.lat,
          lng: loc.lng,
          locationSource: loc.source,
          takenOn: it.exif.date || date || null,
          transect: transect || null,
          quadrat: it.quadrat ? Number(it.quadrat) : null,
          camera: it.exif.camera || null,
          exifLat: it.exif.lat,
          exifLng: it.exif.lng,
        },
      }
    })
    const { sent, errors: errs } = await uploadPhotos(payload, (done) =>
      setBusy({ done, total: items.length, label: "Uploading photos for analysis" })
    )
    setBusy(null)
    if (errs.length) {
      setErrors(errs)
      if (sent) toast.error(`${errs.length} photo${errs.length > 1 ? "s were" : " was"} not sent`, { description: errs[0] })
    }
    if (sent) {
      toast.success(`${sent} photo${sent > 1 ? "s" : ""} sent for analysis`, {
        description: "Results appear on My uploads in about a minute (longer if the GPU is starting).",
      })
      router.push("/uploads")
    } else setStep(0)
  }

  async function analyze() {
    if (remote) return sendForAnalysis()
    setStep(2)
    setBusy({ done: 0, total: items.length, label: "Detecting and classifying coral" })
    const out: Item[] = []
    for (const [n, it] of items.entries()) {
      const result = it.result ?? (await runInference(it.file, { width: it.width, height: it.height }))
      out.push({ ...it, result })
      setBusy({ done: n + 1, total: items.length, label: "Detecting and classifying coral" })
    }
    setItems(out)
    setBusy(null)
    if (out.some((o) => o.result?.reason === "api-error")) toast.warning("The model server did not answer", { description: "Showing simulated results instead." })
  }

  async function submit() {
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const payload = items.map((it, i) => {
      const loc = locate(it)
      const image: ReefImage = {
        id: `UP-${now.getTime().toString(36)}-${i}`,
        file: it.file.name,
        src: it.url,
        thumb: it.url,
        stationId: loc.stationId,
        lat: loc.lat,
        lng: loc.lng,
        date: it.exif.date || date || stamp.slice(0, 10),
        transect,
        quadrat: it.quadrat ? Number(it.quadrat) : null,
        width: it.width,
        height: it.height,
        camera: it.exif.camera,
        detections: it.result!.detections,
        provenance: {
          source: "upload",
          uploader: MY_NAME,
          uploadedAt: stamp,
          locationSource: loc.source,
          models: it.result!.models,
          simulated: it.result!.simulated,
        },
      }
      return { image, file: it.file }
    })
    await addUploads(payload)
    toast.success(`${payload.length} photo${payload.length > 1 ? "s" : ""} saved`, {
      description: unassigned
        ? `The rest count now. ${unassigned} without a station join the map once you choose a station on the photo page.`
        : "They count on the map now. You can correct a class or delete a photo on its page.",
    })
    router.push("/uploads")
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title="Upload photos" description="Add quadrat photos from a survey. Results count on the map right away, and you can correct or delete your own photos afterward." />
      {remote && !user ? (
        <SignInCard />
      ) : (
      <>
      <Stepper step={step} />

      {busy && (
        <Card size="sm">
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> {busy.label}… <span className="tabular ml-auto text-muted-foreground">{busy.done} / {busy.total}</span>
            </div>
            <Progress value={(busy.done / Math.max(1, busy.total)) * 100} />
          </CardContent>
        </Card>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Dropzone onFiles={addFiles} disabled={!!busy} />
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{errors.length} file{errors.length > 1 ? "s were" : " was"} skipped</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.slice(0, 5).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                  {errors.length > 5 && <li>…and {errors.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {items.length > 0 && (
            <Card size="sm" className="gap-0 py-0">
              <ul className="divide-y">
                {items.map((it) => (
                  <li key={it.key} className="flex items-center gap-3 px-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.file.name}</div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span>{formatBytes(it.file.size)}</span>
                        <span className="tabular">
                          {it.width}×{it.height}
                        </span>
                        {it.exif.date && <span>{it.exif.date}</span>}
                        {it.exif.lat != null && (
                          <span className="inline-flex items-center gap-1">
                            <Navigation className="size-3" /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${it.file.name}`} onClick={() => remove(it.key)}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="flex justify-end">
            <Button disabled={!items.length || !!busy} onClick={() => setStep(1)}>
              Continue with {items.length || "no"} photo{items.length === 1 ? "" : "s"} <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <Card>
            <CardHeader>
              <CardTitle>Where were these photos taken?</CardTitle>
              <CardDescription>Station coordinates are shared by every photo from that station.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup value={source} onValueChange={(v) => setSource(v as LocationSource)} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { v: "station", icon: MapPin, title: "Pick a station", hint: "Recommended" },
                  { v: "exif", icon: Navigation, title: "Photo GPS", hint: `${withGps} of ${items.length} have GPS` },
                  { v: "manual", icon: PenLine, title: "Enter coordinates", hint: "Decimal degrees" },
                  { v: "none", icon: CircleSlash, title: "Skip for now", hint: "Assign a station later" },
                ].map((o) => (
                  <Label
                    key={o.v}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary has-data-checked:bg-accent/50",
                      o.v === "exif" && withGps === 0 && "pointer-events-none opacity-50"
                    )}
                  >
                    <RadioGroupItem value={o.v} disabled={o.v === "exif" && withGps === 0} className="mt-0.5" />
                    <span className="grid gap-0.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <o.icon className="size-4" /> {o.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{o.hint}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>

              {source === "station" && (
                <div className="space-y-1.5">
                  <Label htmlFor="station">Station</Label>
                  <Select value={stationId} onValueChange={(v) => setStationId(String(v))}>
                    <SelectTrigger id="station" className="w-full sm:w-80">
                      <SelectValue placeholder="Choose a station">{(v: string) => stationById(v)?.name ?? "Choose a station"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} <span className="text-muted-foreground">· {s.depthM} m</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {source === "exif" && withGps < items.length && (
                <Alert>
                  <AlertTriangle />
                  <AlertTitle>Some photos have no GPS</AlertTitle>
                  <AlertDescription>They are saved without a location and join the map once a station is assigned.</AlertDescription>
                </Alert>
              )}
              {source === "manual" && (
                <div className="space-y-1.5">
                  <div className="grid max-w-md grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input id="lat" inputMode="decimal" placeholder="13.51937" value={lat} onChange={(e) => setLat(e.target.value.replace(",", "."))} aria-invalid={!!manualError && lat !== ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input id="lng" inputMode="decimal" placeholder="120.95555" value={lng} onChange={(e) => setLng(e.target.value.replace(",", "."))} aria-invalid={!!manualError && lng !== ""} />
                    </div>
                  </div>
                  {manualError && (lat !== "" || lng !== "") && <p className="text-sm text-destructive">{manualError}</p>}
                  {manualHint && <p className="text-sm text-muted-foreground">{manualHint}</p>}
                </div>
              )}

              <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Survey date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Used when a photo has no date in its metadata.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="transect">Transect</Label>
                  <Select value={transect} onValueChange={(v) => setTransect(String(v))}>
                    <SelectTrigger id="transect" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["T1", "T2", "T3", "T4", "T5"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Quadrat numbers (optional)</Label>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {items.map((it, i) => (
                    <li key={it.key} className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.url} alt="" className="size-8 rounded object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm">{it.file.name}</span>
                      <Input
                        aria-label={`Quadrat number for ${it.file.name}`}
                        inputMode="numeric"
                        className="h-8 w-20"
                        placeholder="Q"
                        value={it.quadrat}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setItems((prev) => prev.map((p, j) => (j === i ? { ...p, quadrat: v } : p)))
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <LocationSummary items={items} locate={locate} ok={locationOk} />

          <div className="flex justify-between md:col-span-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft data-icon="inline-start" /> Back
            </Button>
            <Button disabled={!locationOk} onClick={analyze}>
              {remote ? "Upload and analyze" : "Analyze"} {items.length} photo{items.length === 1 ? "" : "s"} <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && !busy && (
        <div className="space-y-4">
          {items.some((i) => i.result?.simulated) && !docMode && (
            <Alert>
              <FlaskConical className="text-pb" />
              <AlertTitle>Simulated results</AlertTitle>
              <AlertDescription>
                {apiConfigured
                  ? "The model server could not be reached, so these boxes and classes are simulated."
                  : "No model server is connected yet, so these boxes and classes are simulated to show the workflow."}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((it) => (
              <ResultCard key={it.key} item={it} stationName={stationById(locate(it)?.stationId)?.name} />
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft data-icon="inline-start" /> Back
            </Button>
            <Button onClick={submit}>
              <Upload data-icon="inline-start" /> Save {items.length} photo{items.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Upload steps">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
              i < step && "border-primary bg-primary text-primary-foreground",
              i === step && "border-primary text-primary",
              i > step && "text-muted-foreground"
            )}
          >
            {i < step ? <Check className="size-4" /> : i + 1}
          </span>
          <span className={cn("hidden whitespace-nowrap sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
          {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  )
}

function Dropzone({ onFiles, disabled }: { onFiles: (f: FileList) => void; disabled: boolean }) {
  const [over, setOver] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors",
        over && "border-primary bg-accent/40"
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ImagePlus className="size-6" />
      </span>
      <div>
        <p className="font-medium">Drop quadrat photos here</p>
        <p className="text-sm text-muted-foreground">JPG or PNG, or a ZIP of photos · up to {MAX_BATCH_IMAGES} per batch</p>
      </div>
      <Button variant="outline" disabled={disabled} onClick={() => input.current?.click()}>
        Choose files
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT_BATCH}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ""
        }}
      />
      <p className="text-xs text-muted-foreground">
        No photos at hand? Open any <Link href="/stations" className="underline underline-offset-2">station</Link> to see how results look.
      </p>
    </div>
  )
}

function LocationSummary({ items, locate, ok }: { items: Item[]; locate: (it: Item) => Located; ok: boolean }) {
  const resolved = items.map(locate)
  const placed = resolved.filter((r) => r.stationId)
  const stations = new Set(placed.map((r) => r.stationId))
  const unassigned = resolved.length - placed.length
  const first = resolved.find((r) => r.lat != null)
  return (
    <Card size="sm" className="h-fit">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Photos</span>
          <span className="tabular">{items.length}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Station</span>
          <span className="text-right">
            {!ok ? "–" : stations.size > 1 ? `${stations.size} different` : stations.size === 1 ? stationById(placed[0].stationId)?.name : "None yet"}
          </span>
        </div>
        {ok && first && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">GPS</span>
            <span className="tabular text-right text-xs">{formatCoords(first.lat, first.lng)}</span>
          </div>
        )}
        {ok && unassigned > 0 && (
          <p className="text-xs text-muted-foreground">
            {unassigned} of {items.length} without a station (no location, no station within 1 km, or two depths share the point). They are analyzed
            and saved, and join the map once a station is assigned.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type Located = { lat: number | null; lng: number | null; stationId: string | null; source: LocationSource }

function ResultCard({ item, stationName }: { item: Item; stationName?: string }) {
  const [boxes, setBoxes] = React.useState(true)
  const dets = item.result?.detections ?? []
  const c = countClasses(dets)
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{item.file.name}</CardTitle>
          <CardDescription>{stationName ?? "No station"}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" aria-pressed={boxes} onClick={() => setBoxes((b) => !b)}>
          {boxes ? "Hide boxes" : "Show boxes"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <DetectionViewer image={{ src: item.url, file: item.file.name, width: item.width, height: item.height }} detections={dets} showBoxes={boxes} />
        <ClassBar counts={c} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {HEALTH_CLASSES.map((k) => (
            <span key={k} className="tabular inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: CLASS_META[k].color }} /> {k} {c[k]}
            </span>
          ))}
          <span className="ml-auto text-muted-foreground">
            {totalOf(c)} colonies · {dets.length - totalOf(c)} not coral
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
