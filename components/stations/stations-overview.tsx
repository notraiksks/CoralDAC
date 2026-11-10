"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClassStackChart, type ClassRow } from "@/components/class-chart"
import { ClassBar, Stat } from "@/components/class-ui"
import { PageHeader } from "@/components/page-header"
import { STATIONS } from "@/lib/archive"
import { impactedShare } from "@/lib/classes"
import { exportImagesCsv } from "@/lib/csv"
import { countsOnMap, fmt1, overall, summarizeStations, type HeatMetric } from "@/lib/stats"
import { useStore } from "@/lib/store"

export function StationsOverview() {
  const { images } = useStore()
  const [metric, setMetric] = React.useState<HeatMetric>("perQuadrat")
  const summaries = React.useMemo(() => summarizeStations(STATIONS, images), [images])
  const all = overall(summaries)
  const rows: ClassRow[] = summaries.map((s) => ({ label: s.station.name, ...(metric === "total" ? s.totals : s.perQuadrat) }))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Stations"
        description="Coral colonies counted per health class at each monitoring station, from approved quadrat photos only."
        actions={
          <Button variant="outline" onClick={() => exportImagesCsv(images.filter(countsOnMap), "coraldac-images.csv")}>
            <Download /> Export counts (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Stations" value={all.stations} hint="Puerto Galera, Oriental Mindoro" />
        <Stat label="Approved quadrats" value={all.images} />
        <Stat label="Coral colonies" value={all.colonies} hint={`${fmt1(all.colonies / Math.max(1, all.images))} per quadrat`} />
        <Stat label="Bleached or dead" value={`${Math.round(impactedShare(all.totals) * 100)}%`} hint="PB + DC + DCA" />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Health classes by station</CardTitle>
            <CardDescription>{metric === "perQuadrat" ? "Mean colonies per quadrat photo" : "Total colonies across all approved photos"}</CardDescription>
          </div>
          <ToggleGroup variant="outline" size="sm" spacing={0} value={[metric]} onValueChange={(v) => v[0] && setMetric(v[0] as HeatMetric)}>
            <ToggleGroupItem value="perQuadrat">Per quadrat</ToggleGroupItem>
            <ToggleGroupItem value="total">Total</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          <ClassStackChart rows={rows} unit={metric === "total" ? "colonies" : "per quadrat"} horizontal className="aspect-auto h-72 w-full" />
        </CardContent>
      </Card>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => {
          const cover = images.find((i) => i.stationId === s.station.id && countsOnMap(i))
          return (
            <li key={s.station.id}>
              <Link
                href={`/stations/${s.station.id}`}
                className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="relative h-32 bg-muted">
                  {cover && <Image src={cover.thumb} alt="" fill sizes="400px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-white">
                    <div className="font-semibold">{s.station.name}</div>
                    <div className="text-xs opacity-85">{s.station.depthM ? `${s.station.depthM} m deep` : s.station.depth}</div>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <ClassBar counts={s.totals} />
                  <dl className="grid grid-cols-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Quadrats</dt>
                      <dd className="tabular font-medium">{s.images}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Per quadrat</dt>
                      <dd className="tabular font-medium">{fmt1(s.colonies / Math.max(1, s.images))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Bleached or dead</dt>
                      <dd className="tabular font-medium">{Math.round(impactedShare(s.totals) * 100)}%</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
