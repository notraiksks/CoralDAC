import { CircleCheck, CircleDashed, CircleX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ImageStatus } from "@/lib/types"

const META: Record<ImageStatus, { label: string; icon: typeof CircleCheck; className: string }> = {
  approved: { label: "Approved", icon: CircleCheck, className: "bg-lc/12 text-foreground" },
  pending: { label: "Waiting for review", icon: CircleDashed, className: "bg-pb/15 text-foreground" },
  rejected: { label: "Rejected", icon: CircleX, className: "bg-destructive/10 text-destructive" },
}

export function StatusBadge({ status }: { status: ImageStatus }) {
  const m = META[status]
  return (
    <Badge variant="secondary" className={m.className}>
      <m.icon /> {m.label}
    </Badge>
  )
}
