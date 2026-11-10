"use client"

import { useDocMode } from "@/lib/doc-mode"
import { ChevronsUpDown, Eye, ShieldCheck, UserRound } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { ROLE_META, useStore } from "@/lib/store"
import type { Role } from "@/lib/types"
import { toast } from "sonner"

const ICON: Record<Role, typeof Eye> = { viewer: Eye, contributor: UserRound, reviewer: ShieldCheck }
const HINT: Record<Role, string> = {
  viewer: "Browse the map and stations",
  contributor: "Also upload survey photos",
  reviewer: "Also approve or reject uploads",
}

export function RoleSwitcher() {
  const { role, setRole, resetDemo } = useStore()
  const docMode = useDocMode()
  const Icon = ICON[role]
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" tooltip={`Demo role: ${ROLE_META[role].label}`} />}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
            <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="font-medium">{ROLE_META[role].label}</span>
              {!docMode && <span className="text-xs text-muted-foreground">Demo role</span>}
            </span>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Switch demo role</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
                {(Object.keys(ROLE_META) as Role[]).map((r) => {
                  const I = ICON[r]
                  return (
                    <DropdownMenuRadioItem key={r} value={r} className="items-start py-2">
                      <I className="mt-0.5" />
                      <span className="grid">
                        <span>{ROLE_META[r].label}</span>
                        <span className="text-xs text-muted-foreground">{HINT[r]}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  )
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await resetDemo()
                toast.success("Demo data reset", { description: "Uploads and review decisions were cleared." })
              }}
            >
              Reset demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
