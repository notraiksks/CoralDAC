import { ImageDetail } from "@/components/image/image-detail"

/**
 * A photo's page. Its data is loaded in the browser from the database (store), so nothing here is per-user.
 * V2-0476: the 42 example photos that were prerendered here are gone with the demo mode; every page renders on demand.
 */
export default async function ImagePage({ params }: PageProps<"/images/[id]">) {
  const { id } = await params
  return <ImageDetail id={decodeURIComponent(id)} />
}
