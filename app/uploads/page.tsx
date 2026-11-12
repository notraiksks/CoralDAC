import type { Metadata } from "next"
import { MyUploads } from "@/components/upload/my-uploads"

export const metadata: Metadata = { title: "My uploads" }

export default function UploadsPage() {
  return (
    <MyUploads />
  )
}
