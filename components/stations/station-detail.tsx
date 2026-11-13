"use client"

import * as React from "react"
import Link from "next/link"
import { Download, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClassStackChart, type ClassRow } from "@/components/class-chart"
import { ClassBreakdown, Stat } from "@/components/class-ui"
import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { PhotoGrid } from "@/components/photo-grid"
import { stationById } from "@/lib/archive"
import { addCounts, emptyCounts, HEALTH_CLASSES, imageCounts, impactedShare, totalOf } from "@/lib/classes"
import { exportImagesCsv } from "@/lib/csv"
import { formatCoords } from "@/lib/geo"
import { countsOnMap, fmt1, summarizeStations } from "@/lib/stats"
import { useStore } from "@/lib/store"

const monthLabel = (m: string) => new Date(`${m}-01T00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })

type Sort = "quadrat" | "colonies" | "impacted"
/** photos per page: 6 rows of the widest grid (5 columns) */
const PAGE_SIZE = 30

export function StationDetail({ id }: { id: string }) {
  const station = stationById(id)!
  const { images } = useStore()
  const own = React.useMemo(() => images.filter((i) => i.stationId === id && countsOnMap(i)), [images, id])
  const s = summarizeStations([station], images)[0]
  const months = [...new Set(own.map((i) => i.date.slice(0, 7)))].sort()
  const transects = [...new Set(own.map((i) => i.transect))].sort()

  const [month, setMonth] = React.useState<string>("all")
  const [transect, setTransect] = React.useState<string>("all")
  const [sort, setSort] = React.useState<Sort>("quadrat")
  const [page, setPage] = React.useState(1)
  const photosRef = React.useRef<HTMLElement | null>(null)
  // a new filter or sort starts again at page 1
  const filterBy = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  // mean colonies per quadrat for each survey month x transect
  const rows: ClassRow[] = months.flatMap((m) =>
    transects.map((t) => {
      const group = own.filter((i) => i.date.startsWith(m) && i.transect === t)
      const sum = group.reduce((acc, i) => addCounts(acc, imageCounts(i)), emptyCounts())
      const n = Math.max(1, group.length)
      return { label: `${monthLabel(m).split(" ")[0]} ${t}`, ...Object.fromEntries(HEALTH_CLASSES.map((k) => [k, sum[k] / n])) } as ClassRow
    })
  )

  const shown = own
    .filter((i) => (month === "all" || i.date.startsWith(month)) && (transect === "all" || i.transect === transect))
    .sort((a, b) => {
      if (sort === "colonies") return totalOf(imageCounts(b)) - totalOf(imageCounts(a))
      if (sort === "impacted") return impactedShare(imageCounts(b)) - impactedShare(imageCounts(a))
      return a.date.localeCompare(b.date) || a.transect.localeCompare(b.transect) || (a.quadrat ?? 0) - (b.quadrat ?? 0)
    })

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageItems = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const goTo = (p: number) => {
    setPage(p)
    photosRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        title={station.name}
        description={
          <>
            {station.depthM ? `${station.depthM} m` : station.depth} · {months.map(monthLabel).join(", ") || "no photos"} ·{" "}
            <span className="tabular">{formatCoords(station.lat, station.lng)}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href={`/?station=${station.id}`} />}>
              <MapPin /> Map
            </Button>
            <Button variant="outline" onClick={() => exportImagesCsv(own, `${station.id}-counts.csv`)}>
              <Download /> CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Quadrats" value={s.images} hint={`${transects.length} transects`} />
        <Stat label="Coral colonies" value={s.colonies} hint={`${fmt1(s.colonies / Math.max(1, s.images))} per quadrat`} />
        <Stat label="Affected coral" value={`${Math.round(impactedShare(s.totals) * 100)}%`} hint="PB+DC+DCA" />
        <Stat label="Filtered as not coral" value={s.others} hint="Not counted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Health classes</CardTitle>
            <CardDescription>All quadrats</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassBreakdown counts={s.totals} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By survey and transect</CardTitle>
            <CardDescription>Mean colonies per quadrat</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassStackChart rows={rows} unit="per quadrat" />
          </CardContent>
        </Card>
      </div>

      <section ref={photosRef} className="scroll-mt-16 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">
            Photos <span className="tabular text-sm font-normal text-muted-foreground">{shown.length}</span>
          </h2>
          <Select value={month} onValueChange={(v) => filterBy(setMonth)(String(v))}>
            <SelectTrigger size="sm" aria-label="Survey month" className="w-36">
              <SelectValue>{(v: string) => (v === "all" ? "All surveys" : monthLabel(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surveys</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup variant="outline" size="sm" spacing={0} value={[transect]} onValueChange={(v) => v[0] && filterBy(setTransect)(v[0])} aria-label="Transect">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            {transects.map((t) => (
              <ToggleGroupItem key={t} value={t}>
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={sort} onValueChange={(v) => filterBy(setSort)(v as Sort)}>
            <SelectTrigger size="sm" aria-label="Sort photos" className="w-44">
              <SelectValue>{(v: Sort) => ({ quadrat: "Sort: survey order", colonies: "Sort: most colonies", impacted: "Sort: most affected" })[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quadrat">Survey order</SelectItem>
              <SelectItem value="colonies">Most colonies</SelectItem>
              <SelectItem value="impacted">Most affected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {shown.length ? (
          <>
            <PhotoGrid images={pageItems} />
            <PaginationBar page={current} pages={pages} total={shown.length} pageSize={PAGE_SIZE} onPage={goTo} className="pt-2" />
          </>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No photos match</EmptyTitle>
              <EmptyDescription>Try another survey month or transect.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}
