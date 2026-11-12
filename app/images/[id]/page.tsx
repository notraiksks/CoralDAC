import { ImageDetail } from "@/components/image/image-detail"
import { ARCHIVE_IMAGES } from "@/lib/archive"

/**
 * Static shell (speed): the example photos are prerendered at build time; an uploaded photo's page is rendered once on its
 * first visit and then served from the cache. The photo's data is loaded in the browser (store), so nothing here is per-user.
 */
export function generateStaticParams() {
  return ARCHIVE_IMAGES.map((i) => ({ id: i.id }))
}

export default async function ImagePage({ params }: PageProps<"/images/[id]">) {
  const { id } = await params
  return <ImageDetail id={decodeURIComponent(id)} />
}
