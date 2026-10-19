import type { Metadata } from "next"
import { RoleGate } from "@/components/role-gate"
import { MyUploads } from "@/components/upload/my-uploads"

export const metadata: Metadata = { title: "My uploads" }

export default function UploadsPage() {
  return (
    <RoleGate need="upload">
      <MyUploads />
    </RoleGate>
  )
}
