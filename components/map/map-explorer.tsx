"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import type L from "leaflet"
import { ArrowRight, Layers as LayersIcon, Maximize, Minus, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ClassBreakdown, Stat } from "@/components/class-ui"
import { STATIONS } from "@/lib/archive"
import { HEALTH_CLASSES, impactedShare } from "@/lib/classes"
import { fmt1, HEAT_TARGETS, heatValue, summarizeStations, type HeatMetric, type HeatTarget, type StationSummary } from "@/lib/stats"
import { useStore } from "@/lib/store"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { Basemap } from "./reef-map"
import { INFERNO_CSS } from "@/lib/inferno"

const ReefMap = dynamic(() => import("./reef-map"), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
})

export function MapExplorer() {
  const { images } = useStore()
  const { resolvedTheme } = useTheme()
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const selectedId = params.get("station")

  const [target, setTarget] = React.useState<HeatTarget>("NOTLIVE")
  const [animate, setAnimate] = React.useState(true)
  const [metric, setMetric] = React.useState<HeatMetric>("perQuadrat")
  const [heatOn, setHeatOn] = React.useState(true)
  const [basemap, setBasemap] = React.useState<Basemap>("map")
  const mapRef = React.useRef<L.Map | null>(null)

  const summaries = React.useMemo(() => summarizeStations(STATIONS, images), [images])
  const selected = summaries.find((s) => s.station.id === selectedId) ?? null

  const select = React.useCallback(
    (id: string | null) => {
      const q = new URLSearchParams(params.toString())
      if (id) q.set("station", id)
      else q.delete("station")
      router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false })
      const s = summaries.find((x) => x.station.id === id)
      if (s && mapRef.current) mapRef.current.flyTo([s.station.lat, s.station.lng], Math.max(mapRef.current.getZoom(), 14), { duration: 0.8 })
    },
    [params, pathname, router, summaries]
  )

  const fitAll = () => {
    const m = mapRef.current
    if (!m) return
    m.flyToBounds(
      summaries.map((s) => [s.station.lat, s.station.lng] as [number, number]),
      { paddingTopLeft: [window.innerWidth >= 768 ? 360 : 40, 60], paddingBottomRight: [60, 60], duration: 0.8 }
    )
  }

  // a shared link (?station=...) opens with that station in view
  const initialStation = React.useRef(selected)
  const onReady = React.useCallback((m: L.Map) => {
    mapRef.current = m
    const s = initialStation.current
    if (s) m.setView([s.station.lat, s.station.lng], 14, { animate: false })
  }, [])

  const controls = (
    <LayerControls target={target} setTarget={setTarget} metric={metric} setMetric={setMetric} heatOn={heatOn} setHeatOn={setHeatOn} animate={animate} setAnimate={setAnimate} basemap={basemap} setBasemap={setBasemap} summaries={summaries} />
  )

  return (
    <div className="relative h-[calc(100svh-3rem)] w-full overflow-hidden">
      <ReefMap
        summaries={summaries}
        target={target}
        metric={metric}
        heatOn={heatOn}
        animate={animate}
        basemap={basemap}
        dark={resolvedTheme === "dark"}
        selectedId={selectedId}
        onSelect={select}
        onReady={onReady}
      />

      {/* top-left: search + layers */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-col items-start gap-2 md:w-80">
        <StationSearch summaries={summaries} onPick={select} />
        {isMobile ? (
          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="pointer-events-auto bg-card shadow-md" />}>
              <LayersIcon /> Layers
            </SheetTrigger>
            <SheetContent side="bottom" className="z-[1300] max-h-[80svh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Map layers</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{controls}</div>
            </SheetContent>
          </Sheet>
        ) : (
          <Card className="pointer-events-auto w-full gap-0 p-4 shadow-lg">{controls}</Card>
        )}
      </div>

      {/* zoom */}
      <div className={cn("absolute bottom-6 z-[500] flex flex-col gap-1.5", selected && !isMobile ? "right-[25rem]" : "right-3", selected && isMobile && "hidden")}>
        <MapButton label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
          <Plus />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
          <Minus />
        </MapButton>
        <MapButton label="Show all stations" onClick={fitAll}>
          <Maximize />
        </MapButton>
      </div>

      {selected && <StationPanel s={selected} metric={metric} onClose={() => select(null)} />}
    </div>
  )
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon-lg" aria-label={label} onClick={onClick} className="bg-card shadow-md" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}

function StationSearch({ summaries, onPick }: { summaries: StationSummary[]; onPick: (id: string) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="pointer-events-auto w-full max-w-80 justify-start bg-card text-muted-foreground shadow-md" />
        }
      >
        <Search /> Find a station…
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-72 p-0">
        <Command>
          <CommandInput placeholder="Station, site or depth" />
          <CommandList>
            <CommandEmpty>No station found.</CommandEmpty>
            <CommandGroup heading="Monitoring stations">
              {summaries.map((s) => (
                <CommandItem
                  key={s.station.id}
                  value={`${s.station.name} ${s.station.site} ${s.station.depth}`}
                  onSelect={() => {
                    onPick(s.station.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{s.station.name}</span>
                  <span className="tabular text-xs text-muted-foreground">{s.images} quadrats</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function LayerControls({
  target,
  setTarget,
  metric,
  setMetric,
  heatOn,
  setHeatOn,
  animate,
  setAnimate,
  basemap,
  setBasemap,
  summaries,
}: {
  target: HeatTarget
  setTarget: (t: HeatTarget) => void
  metric: HeatMetric
  setMetric: (m: HeatMetric) => void
  heatOn: boolean
  setHeatOn: (v: boolean) => void
  animate: boolean
  setAnimate: (v: boolean) => void
  basemap: Basemap
  setBasemap: (b: Basemap) => void
  summaries: StationSummary[]
}) {
  const values = summaries.map((s) => heatValue(s, target, metric))
  const max = Math.max(0, ...values)
  const unit = metric === "total" ? "colonies" : "per quadrat"
  const fmt = (v: number) => (metric === "total" ? String(Math.round(v)) : fmt1(v))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Heat shows</h2>
          <Switch checked={heatOn} onCheckedChange={setHeatOn} aria-label="Show heatmap" />
        </div>
        <Select value={target} onValueChange={(v) => setTarget(v as HeatTarget)}>
          <SelectTrigger className="w-full" aria-label="Quantity shown as heat">
            <SelectValue>{(v: HeatTarget) => HEAT_TARGETS.find((t) => t.id === v)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent className="z-[1400]">
            {HEAT_TARGETS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="grid">
                  <span>{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.hint}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* thermal legend */}
        <div className={cn("space-y-1 pt-1 transition-opacity", !heatOn && "opacity-40")}>
          <div className="h-2.5 rounded-full" style={{ background: INFERNO_CSS }} aria-hidden="true" />
          <div className="tabular flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{unit}</span>
            <span>{fmt(max)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Weight</h2>
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
          value={[metric]}
          onValueChange={(v) => v[0] && setMetric(v[0] as HeatMetric)}
        >
          <ToggleGroupItem value="perQuadrat" className="flex-1">
            Per quadrat
          </ToggleGroupItem>
          <ToggleGroupItem value="total" className="flex-1">
            Station total
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {metric === "perQuadrat" ? "Mean colonies per photo: fair across stations." : "All colonies at the station, summed."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <Tooltip>
          <TooltipTrigger render={<label className="flex items-center gap-2 text-sm" />}>
            <Switch checked={animate} onCheckedChange={setAnimate} disabled={!heatOn} /> Motion
          </TooltipTrigger>
          <TooltipContent className="max-w-56">A slow shimmer for a live feel. It never changes the values; turn it off for an exact still.</TooltipContent>
        </Tooltip>
        <ToggleGroup variant="outline" size="sm" spacing={0} value={[basemap]} onValueChange={(v) => v[0] && setBasemap(v[0] as Basemap)}>
          <ToggleGroupItem value="map">Map</ToggleGroupItem>
          <ToggleGroupItem value="satellite">Satellite</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

function StationPanel({ s, metric, onClose }: { s: StationSummary; metric: HeatMetric; onClose: () => void }) {
  const { images } = useStore()
  const photos = images.filter((i) => i.stationId === s.station.id && i.status === "approved")
  const months = [...new Set(photos.map((p) => p.date.slice(0, 7)))].sort()
  const monthLabel = months
    .map((m) => new Date(`${m}-01T00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }))
    .join(", ")

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <Card
      role="region"
      aria-label={`${s.station.name} summary`}
      className="absolute inset-x-2 bottom-2 z-[600] max-h-[62%] gap-0 overflow-y-auto p-0 shadow-xl md:inset-x-auto md:top-3 md:right-3 md:bottom-3 md:max-h-none md:w-[24rem]"
    >
      <div className="sticky top-0 z-10 flex items-start gap-2 border-b bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{s.station.name}</h2>
          <p className="text-xs text-muted-foreground">
            {s.station.depthM ? `${s.station.depthM} m` : s.station.depth} · {monthLabel || "no approved photos"}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close station panel" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="space-y-5 p-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Quadrats" value={s.images} />
          <Stat label="Colonies" value={s.colonies} hint={`${fmt1(s.colonies / Math.max(1, s.images))} / quadrat`} />
          <Stat label="Not live" value={`${Math.round(impactedShare(s.totals) * 100)}%`} hint="PB + DC + DCA" />
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Health classes</h3>
          <ClassBreakdown counts={s.totals} secondary={s.perQuadrat} secondaryLabel="per quadrat" />
          {metric === "perQuadrat" && (
            <p className="tabular text-xs text-muted-foreground">
              Per quadrat: {HEALTH_CLASSES.map((k) => `${k} ${fmt1(s.perQuadrat[k])}`).join(" · ")}
            </p>
          )}
          {s.others > 0 && (
            <p className="text-xs text-muted-foreground">
              {s.others} detections were filtered out as not coral and are not counted.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Photos</h3>
            <span className="text-xs text-muted-foreground">{photos.length}</span>
          </div>
          <ul className="grid grid-cols-3 gap-1.5">
            {photos.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/images/${p.id}`}
                  className="group relative block aspect-square overflow-hidden rounded-md bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Image src={p.thumb} alt={`${p.file}, ${p.transect} quadrat ${p.quadrat}`} fill sizes="120px" className="object-cover transition-transform group-hover:scale-105" unoptimized />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-4 pb-1 text-[11px] font-medium text-white">
                    {p.transect} · Q{p.quadrat}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Button className="w-full" nativeButton={false} render={<Link href={`/stations/${s.station.id}`} />}>
          Open station <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </Card>
  )
}
