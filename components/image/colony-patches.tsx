"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PatchImage } from "@/components/image/colony-panel"
import { ClassDot } from "@/components/class-ui"
import { CLASS_META, finalClass } from "@/lib/classes"
import type { Detection, ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Right column of the photo page: one tile per colony, framed like the patches the ResNet50 classifiers receive (box + 10% margin,
 * letterboxed to a square on the training gray). Hover a tile to find its box on the photo; click it (or a box) to open its detail
 * at the top of the column.
 */
export function ColonyPatches({
  image,
  detections,
  hoverId,
  pickedId,
  onHover,
  onPick,
  detail,
  className,
}: {
  image: Pick<ReefImage, "src" | "width" | "height">
  detections: Detection[]
  hoverId: string | null
  pickedId: string | null
  onHover: (id: string | null) => void
  onPick: (id: string) => void
  /** the picked colony's detail, shown above the tiles */
  detail?: React.ReactNode
  className?: string
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  // a picked colony's detail opens at the top of this column: scroll only the column (never the page) back to it
  React.useEffect(() => {
    if (pickedId) listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [pickedId])

  return (
    <Card size="sm" className={cn("gap-0 pb-0 lg:max-h-[calc(100svh-5rem)]", className)}>
      <CardHeader className="flex flex-row items-baseline gap-2 pb-3">
        <CardTitle>Colony patches</CardTitle>
        <span className="tabular text-xs text-muted-foreground">{detections.length}</span>
        <Tooltip>
          <TooltipTrigger className="ml-auto cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
            How they are cut
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            Each patch is the detector&apos;s box plus a 10% margin, fitted into a square like the patches the health classifier
            receives. Cut from the photo shown on this page.
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t pt-3 pb-6 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,black_calc(100%-1.75rem),transparent)] [&::-webkit-scrollbar]:hidden">
        {detail && <div className="mb-3">{detail}</div>}
        {detections.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No colonies to show.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {detections.map((d) => {
              const cls = finalClass(d)
              const picked = pickedId === d.id
              const hovered = hoverId === d.id
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onMouseEnter={() => onHover(d.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(d.id)}
                    onBlur={() => onHover(null)}
                    onClick={() => onPick(d.id)}
                    aria-pressed={picked}
                    aria-label={`Colony ${d.id}, ${CLASS_META[cls].label}`}
                    className={cn(
                      "group block w-full overflow-hidden rounded-md text-left ring-1 ring-foreground/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      (hovered || picked) && "ring-2",
                      cls === "OTHERS" && "opacity-70"
                    )}
                    style={hovered || picked ? ({ "--tw-ring-color": CLASS_META[cls].color } as React.CSSProperties) : undefined}
                  >
                    <PatchImage image={image} det={d} />
                    <span className="flex items-center gap-1 px-1.5 py-1 text-[11px] leading-none">
                      <ClassDot cls={cls} className="size-2" />
                      <span className="font-medium">{cls === "OTHERS" ? "Other" : cls}</span>
                      <span className="tabular ml-auto text-muted-foreground">{d.id}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
