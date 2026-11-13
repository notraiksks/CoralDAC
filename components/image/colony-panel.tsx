"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClassDot } from "@/components/class-ui"
import { CLASS_META, finalClass, HEALTH_CLASSES } from "@/lib/classes"
import type { Detection, HealthClass, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/** margin added on every side of the box: the same 10% as the classifier's patches (stage2_a20.colony_crop) */
const PAD = 0.1
/** letterbox colour of the classifier's 224 px inputs (stage2_a20.GRAY_PAD) */
const LETTERBOX = "rgb(123 116 103)"

/**
 * One colony framed like the classifier's patch: box + 10% margin (kept inside the photo), fitted into a square on the letterbox
 * gray. Cut with CSS from the photo already on the page, so it needs no extra download. outline = the SAM outline (or the box).
 */
export function PatchImage({
  image,
  det,
  outline = false,
  className,
}: {
  image: Pick<ReefImage, "src" | "width" | "height">
  det: Detection
  outline?: boolean
  className?: string
}) {
  const cls = finalClass(det)
  const ratio = image.width / image.height
  const [x, y, w, h] = det.box
  const rx = Math.max(0, x - w * PAD)
  const ry = Math.max(0, y - h * PAD)
  const rw = Math.min(1, x + w * (1 + PAD)) - rx
  const rh = Math.min(1, y + h * (1 + PAD)) - ry
  const regionRatio = (rw * image.width) / (rh * image.height)
  // inside a square: the longer side fills it, the other is centred (the letterbox)
  const size = regionRatio >= 1 ? { width: "100%", height: `${100 / regionRatio}%` } : { width: `${100 * regionRatio}%`, height: "100%" }
  return (
    <div className={cn("relative aspect-square w-full overflow-hidden", className)} style={{ background: LETTERBOX }}>
      <div className="absolute inset-0 m-auto overflow-hidden" style={size}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt=""
          draggable={false}
          loading="lazy"
          className="absolute max-w-none select-none"
          style={{ width: `${100 / rw}%`, height: `${100 / rh}%`, left: `${(-rx / rw) * 100}%`, top: `${(-ry / rh) * 100}%` }}
        />
        {outline && (
          <svg viewBox={`${rx * ratio} ${ry} ${rw * ratio} ${rh}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
            {cls !== "OTHERS" && det.mask && det.mask.length > 2 ? (
              <polygon
                points={det.mask.map(([px, py]) => `${px * ratio},${py}`).join(" ")}
                fill="none"
                stroke={CLASS_META[cls].color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <rect
                x={x * ratio}
                y={y}
                width={w * ratio}
                height={h}
                fill="none"
                stroke={CLASS_META[cls].color}
                strokeWidth={2}
                strokeDasharray={cls === "OTHERS" ? "6 4" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  )
}

/**
 * The enlarged patch of one detected colony, cut from the photo already on the page (no extra download), with its outline, class,
 * confidences and class probabilities. Opened by clicking a box or a row of the Detections list.
 */
export function ColonyPanel({
  image,
  det,
  index,
  total,
  canEdit,
  onStep,
  onClose,
  onSetClass,
  className,
  style,
}: {
  image: Pick<ReefImage, "src" | "thumb" | "width" | "height">
  det: Detection
  index: number
  total: number
  canEdit: boolean
  onStep: (delta: -1 | 1) => void
  onClose: () => void
  onSetClass: (cls: HealthClass | "OTHERS") => void
  className?: string
  style?: React.CSSProperties
}) {
  const cls = finalClass(det)
  const meta = CLASS_META[cls]
  const probs = det.p ? HEALTH_CLASSES.map((k) => ({ k, v: det.p![k] })) : null

  return (
    <section
      aria-label={`Colony ${det.id}`}
      className={cn("flex w-60 flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10", className)}
      style={style}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <header className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Colony <span className="tabular">{det.id}</span>
        </span>
        <span className="ml-auto flex items-center">
          <Button variant="ghost" size="icon-xs" aria-label="Previous colony" disabled={total < 2} onClick={() => onStep(-1)}>
            <ChevronLeft />
          </Button>
          <span className="tabular px-0.5 text-xs text-muted-foreground">
            {index + 1}/{total}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label="Next colony" disabled={total < 2} onClick={() => onStep(1)}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </span>
      </header>
      <p className="-mt-1 flex items-center gap-1.5 font-medium">
        <ClassDot cls={cls} />
        <span className="min-w-0 flex-1">{meta.label}</span>
        <span className="tabular text-xs font-normal text-muted-foreground" title="Class confidence">
          {(cls === "OTHERS" ? det.filterConf : det.healthConf ?? 0).toFixed(2)}
        </span>
      </p>

      <PatchImage image={image} det={det} outline className="rounded-md" />

      {probs && cls !== "OTHERS" && (
        <dl className="space-y-1" aria-label="Health class probabilities">
          {probs.map(({ k, v }) => (
            <div key={k} className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 text-xs">
              <dt className={cn("text-muted-foreground", k === det.health && "font-medium text-foreground")}>{k}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full" style={{ width: `${Math.round(v * 100)}%`, background: CLASS_META[k].color }} />
              </dd>
              <dd className="tabular text-right">{v.toFixed(2)}</dd>
            </div>
          ))}
        </dl>
      )}

      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-muted-foreground">Detector confidence</dt>
        <dd className="tabular text-right">{det.detConf.toFixed(2)}</dd>
        <dt className="text-muted-foreground">Coral filter ({det.filter === "OTHERS" ? "not coral" : "coral"})</dt>
        <dd className="tabular text-right">{det.filterConf.toFixed(2)}</dd>
        {det.corrected && (
          <>
            <dt className="text-muted-foreground">Model said</dt>
            <dd className="text-right">{det.filter === "OTHERS" || !det.health ? "Not coral" : det.health}</dd>
          </>
        )}
      </dl>
      {det.corrected && <p className="text-xs text-muted-foreground">Class corrected by the uploader.</p>}

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="w-full" />}>
            <Pencil /> Correct the class
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Correct the class</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={cls} onValueChange={(v) => onSetClass(v as HealthClass | "OTHERS")}>
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
    </section>
  )
}
