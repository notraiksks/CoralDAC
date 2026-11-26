"use client"

import Image from "next/image"
import Link from "next/link"
import { ClassBar } from "@/components/class-ui"
import { imageCounts, totalOf } from "@/lib/classes"
import { quadratLabel } from "@/lib/photo-order"
import type { ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PhotoGrid({ images, className }: { images: ReefImage[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {images.map((img) => {
        const c = imageCounts(img)
        const label = quadratLabel(img)
        return (
          <li key={img.id}>
            <Link
              href={`/images/${img.id}`}
              className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="relative aspect-square bg-muted">
                <Image src={img.thumb} alt={`${img.file}, ${label}`} fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized />
                {/* V2-0475: uploads are marked, so they can be told apart from the survey photos */}
                {img.provenance.source === "upload" && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {img.provenance.uploader === "You" ? "Your upload" : "Upload"}
                  </span>
                )}
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium" title={img.file}>
                    {label}
                  </span>
                  <span className="tabular shrink-0 text-xs text-muted-foreground">{totalOf(c)} colonies</span>
                </div>
                <ClassBar counts={c} height="h-1.5" />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
