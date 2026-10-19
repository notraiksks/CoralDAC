import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MapExplorer } from "@/components/map/map-explorer"

export default function MapPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[calc(100svh-3rem)] w-full rounded-none" />}>
      <MapExplorer />
    </Suspense>
  )
}
