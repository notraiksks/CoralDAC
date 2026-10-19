"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FlaskConical, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { stationById } from "@/lib/archive"
import { apiConfigured } from "@/lib/classify"
import { useStore } from "@/lib/store"

const SECTION: Record<string, string> = {
  stations: "Stations",
  images: "Photos",
  upload: "Upload photos",
  uploads: "My uploads",
  review: "Review queue",
  about: "How it works",
}

function useCrumbs(): { href: string; label: string }[] {
  const pathname = usePathname()
  const { getImage } = useStore()
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) return [{ href: "/", label: "Reef map" }]
  const crumbs: { href: string; label: string }[] = []
  if (parts[0] === "images") {
    const img = getImage(decodeURIComponent(parts[1] ?? ""))
    const st = stationById(img?.stationId)
    crumbs.push({ href: "/stations", label: "Stations" })
    if (st) crumbs.push({ href: `/stations/${st.id}`, label: st.name })
    crumbs.push({ href: pathname, label: img?.file ?? "Photo" })
    return crumbs
  }
  crumbs.push({ href: `/${parts[0]}`, label: SECTION[parts[0]] ?? parts[0] })
  if (parts[0] === "stations" && parts[1]) crumbs.push({ href: pathname, label: stationById(parts[1])?.name ?? parts[1] })
  return crumbs
}

export function SiteHeader() {
  const crumbs = useCrumbs()
  return (
    <header className="sticky top-0 z-[1100] flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-4 self-center" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((c, i) => (
            <React.Fragment key={c.href}>
              {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden sm:inline-flex" : "min-w-0"}>
                {i < crumbs.length - 1 ? (
                  <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <DemoBadge />
      <ThemeToggle />
    </header>
  )
}

function DemoBadge() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 border-dashed text-muted-foreground">
            <FlaskConical className="text-pb" />
            <span className="hidden sm:inline">{apiConfigured ? "Model API" : "Demo data"}</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 text-sm">
        <p className="font-medium">What is real on this page?</p>
        <ul className="mt-2 space-y-1.5 text-muted-foreground">
          <li>
            <span className="text-foreground">Real:</span> survey photos, stations, dates and GPS from the 2024 CoralNet
            survey, and the coral boxes from the frozen YOLOv8 detector.
          </li>
          <li>
            <span className="text-foreground">Simulated:</span> the coral / not-coral filter and the health classes (LC, PB, DC,
            DCA). The Stage 2 models are not trained yet.
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])
  const order = ["light", "dark", "system"] as const
  const current = mounted ? ((theme as (typeof order)[number]) ?? "system") : "system"
  const next = order[(order.indexOf(current) + 1) % order.length]
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Theme: ${current}. Switch to ${next}`} onClick={() => setTheme(next)} />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>Theme: {current}</TooltipContent>
    </Tooltip>
  )
}
