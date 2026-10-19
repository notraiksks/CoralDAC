import type { Metadata } from "next"
import { StationsOverview } from "@/components/stations/stations-overview"

export const metadata: Metadata = { title: "Stations" }

export default function StationsPage() {
  return <StationsOverview />
}
