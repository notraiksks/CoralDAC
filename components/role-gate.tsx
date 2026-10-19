"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ROLE_META, useStore } from "@/lib/store"
import type { Role } from "@/lib/types"

/** Shows children only for roles that may use the page; offers a one-click switch in the demo. */
export function RoleGate({ need, children }: { need: "upload" | "review"; children: React.ReactNode }) {
  const { role, setRole, ready } = useStore()
  if (!ready || ROLE_META[role].can[need]) return <>{children}</>
  const target: Role = need === "review" ? "reviewer" : "contributor"
  return (
    <Empty className="m-4 border md:m-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>{need === "review" ? "Reviewers only" : "Contributors only"}</EmptyTitle>
        <EmptyDescription>
          You are browsing as a {ROLE_META[role].label.toLowerCase()}. In the real system this needs a {ROLE_META[target].label.toLowerCase()} account.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => setRole(target)}>Switch to {ROLE_META[target].label.toLowerCase()} (demo)</Button>
      </EmptyContent>
    </Empty>
  )
}
