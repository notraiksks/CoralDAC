import { SURVEY_STATIONS } from "@/lib/stations"
import { StationDetail } from "@/components/stations/station-detail"

/**
 * A station's page. V2-0481: users can create stations, so the page is rendered on demand and the station is looked up in the
 * browser (store); an unknown id shows "Station not found" there. The title names the survey stations; user stations get theirs
 * from the page heading.
 */
export async function generateMetadata({ params }: PageProps<"/stations/[id]">) {
  const { id } = await params
  return { title: SURVEY_STATIONS.find((s) => s.id === id)?.name ?? "Station" }
}

export default async function StationPage({ params }: PageProps<"/stations/[id]">) {
  const { id } = await params
  return <StationDetail id={decodeURIComponent(id)} />
}
