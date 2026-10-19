import type { Metadata } from "next"
import { RoleGate } from "@/components/role-gate"
import { UploadFlow } from "@/components/upload/upload-flow"

export const metadata: Metadata = { title: "Upload photos" }

export default function UploadPage() {
  return (
    <RoleGate need="upload">
      <UploadFlow />
    </RoleGate>
  )
}
