import type { Metadata } from "next"
import { RoleGate } from "@/components/role-gate"
import { ReviewQueue } from "@/components/review/review-queue"

export const metadata: Metadata = { title: "Review queue" }

export default function ReviewPage() {
  return (
    <RoleGate need="review">
      <ReviewQueue />
    </RoleGate>
  )
}
