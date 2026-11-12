"use client"

import Image from "next/image"
import Link from "next/link"
import { ClassBar } from "@/components/class-ui"
import { countClasses, totalOf } from "@/lib/classes"
import type { ReefImage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PhotoGrid({ images, className }: { images: ReefImage[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {images.map((img) => {
        const c = countClasses(img.detections)
        return (
          <li key={img.id}>
            <Link
              href={`/images/${img.id}`}
              className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="relative aspect-square bg-muted">
                <Image src={img.thumb} alt={`${img.file}, ${img.transect} quadrat ${img.quadrat ?? ""}`} fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized />
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">
                    {img.transect} · Q{img.quadrat ?? "–"}
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
