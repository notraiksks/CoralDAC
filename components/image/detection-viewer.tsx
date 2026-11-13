"use client"

import * as React from "react"
import Image from "next/image"
import { CLASS_META, finalClass } from "@/lib/classes"
import type { Detection, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Photo with detection boxes drawn in an SVG overlay (normalized coordinates, so it scales with the image).
 * Coral boxes take their health-class color; boxes the filter rejected as OTHERS are dashed gray.
 * Coral colonies with a SAM outline from the model server (d.mask) also get a thin outline in the same color.
 */
export function DetectionViewer({
  image,
  detections,
  showBoxes = true,
  showOutlines = true,
  hoverId,
  onHover,
  onPick,
  reserveRem = 12,
  overlay,
  className,
}: {
  image: Pick<ReefImage, "src" | "file" | "width" | "height"> & { thumb?: string }
  detections: Detection[]
  showBoxes?: boolean
  /** the SAM colony outlines (drawn even when the boxes are hidden) */
  showOutlines?: boolean
  hoverId?: string | null
  onHover?: (id: string | null) => void
  onPick?: (id: string) => void
  /** viewport height (rem) kept free for the page chrome around the photo; smaller = larger photo */
  reserveRem?: number
  /** drawn above the boxes, positioned by the caller relative to the photo frame */
  overlay?: React.ReactNode
  className?: string
}) {
  const ratio = image.width / image.height
  return (
    <div
      className={cn("relative mx-auto w-full overflow-hidden rounded-lg bg-muted", className)}
      // fit the whole photo in the viewport height on desktop
      style={{
        aspectRatio: ratio,
        maxWidth: `max(20rem, calc((100svh - ${reserveRem}rem) * ${ratio}))`,
        // the thumbnail (already cached from the lists) fills the frame until the full photo arrives
        backgroundImage: image.thumb ? `url("${image.thumb}")` : undefined,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Image src={image.src} alt={`Quadrat photo ${image.file}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" unoptimized priority />
      {(showBoxes || showOutlines) && (
        <svg viewBox={`0 0 ${ratio} 1`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {detections.map((d) => {
            const cls = finalClass(d)
            const [x, y, w, h] = d.box
            const active = hoverId === d.id
            const dim = hoverId != null && !active
            return (
              <g key={d.id}>
              {showOutlines && cls !== "OTHERS" && d.mask && d.mask.length > 2 && (
                <polygon
                  points={d.mask.map(([px, py]) => `${px * ratio},${py}`).join(" ")}
                  fill="none"
                  stroke={CLASS_META[cls].color}
                  strokeOpacity={dim ? 0.3 : 0.9}
                  strokeWidth={active ? 2.5 : 1.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "none" }}
                />
              )}
              <rect
                x={x * ratio}
                y={y}
                width={w * ratio}
                height={h}
                rx={0.004}
                fill={active ? CLASS_META[cls].color : "transparent"}
                fillOpacity={active ? 0.25 : 0}
                stroke={CLASS_META[cls].color}
                strokeOpacity={!showBoxes && !active ? 0 : dim ? 0.35 : 1}
                strokeWidth={active ? 4 : 2.25}
                strokeDasharray={cls === "OTHERS" ? "6 4" : undefined}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-[stroke-opacity]"
                style={{ pointerEvents: "all" }}
                onMouseEnter={() => onHover?.(d.id)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onPick?.(d.id)}
              />
              </g>
            )
          })}
        </svg>
      )}
      {overlay}
    </div>
  )
}
