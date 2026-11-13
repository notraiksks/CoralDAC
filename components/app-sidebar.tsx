"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FolderUp, Info, LogOut, Map, MapPin, Upload } from "lucide-react"
import { ContributeButton } from "@/components/auth/sign-in-card"
import { useStore } from "@/lib/store"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"

const EXPLORE = [
  { href: "/", label: "Reef map", icon: Map },
  { href: "/stations", label: "Stations", icon: MapPin },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { remote, user, signOut } = useStore()
  // "/upload" must not light up on "/uploads": a tab is active on its own path and the pages below it only
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`))
  // signed-out visitors only explore (Rai, V2-0378); the Contribute button signs them in or up
  const signedIn = !remote || Boolean(user)
  const username = user?.email?.replace(/@coraldac\.local$/, "")

  const work = signedIn
    ? [
        { href: "/upload", label: "Upload photos", icon: Upload },
        { href: "/uploads", label: "My uploads", icon: FolderUp },
      ]
    : []

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
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {!signedIn && (
          <SidebarGroup>
            <SidebarGroupContent className="px-1 group-data-[collapsible=icon]:px-0">
              <ContributeButton className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0" />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {remote && user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={async () => {
                      await signOut()
                      router.push("/")
                    }}
                    tooltip={username ? `Sign out (signed in as ${username})` : "Sign out"}
                  >
                    <LogOut />
                    <span className="truncate">Sign out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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

      <SidebarRail />
    </Sidebar>
  )
}
