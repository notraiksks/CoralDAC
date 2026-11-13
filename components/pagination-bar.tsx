"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** page numbers to show: always the first and last, the current page and its neighbors, gaps as null */
function pageList(page: number, pages: number): (number | null)[] {
  const want = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...want].sort((a, b) => a - b)
  const out: (number | null)[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : null)
    out.push(p)
  })
  return out
}

/** Previous / page numbers / next, with the range shown. Hidden when everything fits on one page. */
export function PaginationBar({
  page,
  pages,
  total,
  pageSize,
  onPage,
  className,
}: {
  page: number
  pages: number
  total: number
  pageSize: number
  onPage: (page: number) => void
  className?: string
}) {
  if (pages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav aria-label="Pages" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="tabular text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft />
        </Button>
        {pageList(page, pages).map((p, i) =>
          p == null ? (
            <span key={`gap-${i}`} className="flex size-8 items-center justify-center text-muted-foreground" aria-hidden="true">
              <MoreHorizontal className="size-4" />
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "secondary" : "ghost"}
              size="icon-sm"
              className="tabular"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPage(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
