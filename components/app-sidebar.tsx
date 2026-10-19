"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardCheck, FolderUp, Info, Map, MapPin, Upload } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { RoleSwitcher } from "@/components/role-switcher"
import { ROLE_META, useStore } from "@/lib/store"

const EXPLORE = [
  { href: "/", label: "Reef map", icon: Map },
  { href: "/stations", label: "Stations", icon: MapPin },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { role, images } = useStore()
  const can = ROLE_META[role].can
  const pending = images.filter((i) => i.status === "pending").length
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const work = [
    can.upload && { href: "/upload", label: "Upload photos", icon: Upload },
    can.upload && { href: "/uploads", label: "My uploads", icon: FolderUp },
    can.review && { href: "/review", label: "Review queue", icon: ClipboardCheck, badge: pending },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Map; badge?: number }[]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip="CoralDAC">
              <Logo className="size-8 shrink-0" />
              <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-semibold">CoralDAC</span>
                <span className="text-xs text-muted-foreground">Reef health mapping</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {EXPLORE.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive(item.href)} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {work.length > 0 && (
          <>
            <SidebarSeparator className="mx-3 bg-foreground/15 data-horizontal:w-auto group-data-[collapsible=icon]:mx-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Contribute</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {work.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive(item.href)} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {!!item.badge && <SidebarMenuBadge className="tabular">{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/about" />} isActive={isActive("/about")} tooltip="How it works">
                  <Info />
                  <span>How it works</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <RoleSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
