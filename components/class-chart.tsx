"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ClassDot } from "@/components/class-ui"
import { CLASS_META, HEALTH_CLASSES } from "@/lib/classes"
import type { HealthClass } from "@/lib/types"

const config = Object.fromEntries(HEALTH_CLASSES.map((k) => [k, { label: CLASS_META[k].label, color: CLASS_META[k].color }])) satisfies ChartConfig

export type ClassRow = { label: string } & Record<HealthClass, number>

/** Stacked bars of colonies per health class, one bar per row (station, transect, month...). */
export function ClassStackChart({ rows, unit, horizontal, className }: { rows: ClassRow[]; unit: string; horizontal?: boolean; className?: string }) {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))
  return (
    <div className="space-y-2">
      <ChartContainer config={config} className={className ?? "aspect-auto h-64 w-full"}>
        <BarChart data={rows} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 0, right: 8, top: 8 }} accessibilityLayer>
          <CartesianGrid vertical={!!horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={150} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} tickFormatter={fmt} />
            </>
          )}
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={(v, name) => (
            <span className="flex w-full items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: CLASS_META[name as HealthClass].color }} />
              <span className="flex-1 text-muted-foreground">{CLASS_META[name as HealthClass].label}</span>
              <span className="tabular font-medium">{fmt(Number(v))} {unit}</span>
            </span>
          )} />} />
          {HEALTH_CLASSES.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="a"
              fill={`var(--color-${k})`}
              radius={i === HEALTH_CLASSES.length - 1 ? (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
      {/* legend in class order (Recharts would sort it alphabetically) */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {HEALTH_CLASSES.map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <ClassDot cls={k} /> {CLASS_META[k].label}
          </li>
        ))}
      </ul>
    </div>
  )
}
