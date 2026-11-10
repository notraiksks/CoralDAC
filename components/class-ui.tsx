"use client"

import { CLASS_META, HEALTH_CLASSES, totalOf } from "@/lib/classes"
import type { ClassCounts, HealthClass } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AnyClass = HealthClass | "OTHERS"

export function ClassDot({ cls, className }: { cls: AnyClass; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: CLASS_META[cls].color }}
    />
  )
}

/** Compact class chip: color dot + code, full name in a tooltip. */
export function ClassBadge({ cls, className, long }: { cls: AnyClass; className?: string; long?: boolean }) {
  const meta = CLASS_META[cls]
  const chip = (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
        cls === "OTHERS" && "text-muted-foreground",
        className
      )}
    >
      <ClassDot cls={cls} />
      {long ? meta.label : cls === "OTHERS" ? "Other" : cls}
    </span>
  )
  if (long) return chip
  return (
    <Tooltip>
      <TooltipTrigger render={chip} />
      <TooltipContent>
        {meta.label} — {meta.hint}
      </TooltipContent>
    </Tooltip>
  )
}

/** Stacked bar of colony counts per class, with an accessible text equivalent. */
export function ClassBar({ counts, className, height = "h-2.5" }: { counts: ClassCounts; className?: string; height?: string }) {
  const total = totalOf(counts)
  const label = HEALTH_CLASSES.map((k) => `${CLASS_META[k].label} ${counts[k]}`).join(", ")
  return (
    <div role="img" aria-label={total ? label : "No coral colonies"} className={cn("flex w-full overflow-hidden rounded-full bg-muted", height, className)}>
      {total > 0 &&
        HEALTH_CLASSES.map((k) =>
          counts[k] ? <span key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: CLASS_META[k].color }} /> : null
        )}
    </div>
  )
}

/** Legend rows: class, count, share. */
export function ClassBreakdown({
  counts,
  secondary,
  secondaryLabel,
}: {
  counts: ClassCounts
  secondary?: Record<HealthClass, number>
  secondaryLabel?: string
}) {
  const total = totalOf(counts)
  return (
    <div className="space-y-3">
      <ClassBar counts={counts} />
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
        {HEALTH_CLASSES.map((k) => (
          <div key={k} className="flex items-center gap-2">
            <ClassDot cls={k} />
            <dt className="min-w-0 flex-1 truncate text-muted-foreground" title={CLASS_META[k].label}>
              {CLASS_META[k].label}
            </dt>
            <dd className="tabular font-medium">
              {counts[k]}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {total ? `${Math.round((counts[k] / total) * 100)}%` : ""}
              </span>
            </dd>
            {secondary && (
              <dd className="sr-only">
                {secondaryLabel} {secondary[k].toFixed(1)}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Stat({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card px-3 py-2.5", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tabular mt-0.5 text-lg font-semibold leading-tight">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
