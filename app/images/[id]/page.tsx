import { ImageDetail } from "@/components/image/image-detail"

export default async function ImagePage({ params }: PageProps<"/images/[id]">) {
  const { id } = await params
  return <ImageDetail id={decodeURIComponent(id)} />
}
