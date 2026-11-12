import { Skeleton } from "@/components/ui/skeleton"

/** Shown at once on navigation while the next page's code arrives. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
