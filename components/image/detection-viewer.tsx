"use client"

import * as React from "react"
import Image from "next/image"
import { CLASS_META, finalClass } from "@/lib/classes"
import type { Detection, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Photo with detection boxes drawn in an SVG overlay (normalized coordinates, so it scales with the image).
 * Coral boxes take their health-class color; boxes the filter rejected as OTHERS are dashed gray.
 */
export function DetectionViewer({
  image,
  detections,
  showBoxes = true,
  hoverId,
  onHover,
  onPick,
  className,
}: {
  image: Pick<ReefImage, "src" | "file" | "width" | "height">
  detections: Detection[]
  showBoxes?: boolean
  hoverId?: string | null
  onHover?: (id: string | null) => void
  onPick?: (id: string) => void
  className?: string
}) {
  const ratio = image.width / image.height
  return (
    <div
      className={cn("relative mx-auto w-full overflow-hidden rounded-lg bg-muted", className)}
      // fit the whole photo in the viewport height on desktop
      style={{ aspectRatio: ratio, maxWidth: `max(20rem, calc((100svh - 12rem) * ${ratio}))` }}
    >
      <Image src={image.src} alt={`Quadrat photo ${image.file}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" unoptimized priority />
      {showBoxes && (
        <svg viewBox={`0 0 ${ratio} 1`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {detections.map((d) => {
            const cls = finalClass(d)
            const [x, y, w, h] = d.box
            const active = hoverId === d.id
            const dim = hoverId != null && !active
            return (
              <rect
                key={d.id}
                x={x * ratio}
                y={y}
                width={w * ratio}
                height={h}
                rx={0.004}
                fill={active ? CLASS_META[cls].color : "transparent"}
                fillOpacity={active ? 0.25 : 0}
                stroke={CLASS_META[cls].color}
                strokeOpacity={dim ? 0.35 : 1}
                strokeWidth={active ? 4 : 2.25}
                strokeDasharray={cls === "OTHERS" ? "6 4" : undefined}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-[stroke-opacity]"
                style={{ pointerEvents: "all" }}
                onMouseEnter={() => onHover?.(d.id)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onPick?.(d.id)}
              />
            )
          })}
        </svg>
      )}
    </div>
  )
}
