import { notFound } from "next/navigation"
import { STATIONS, stationById } from "@/lib/archive"
import { StationDetail } from "@/components/stations/station-detail"

export function generateStaticParams() {
  return STATIONS.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: PageProps<"/stations/[id]">) {
  const { id } = await params
  return { title: stationById(id)?.name ?? "Station" }
}

export default async function StationPage({ params }: PageProps<"/stations/[id]">) {
  const { id } = await params
  if (!stationById(id)) notFound()
  return <StationDetail id={id} />
}
