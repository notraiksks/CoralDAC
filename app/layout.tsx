import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { StoreProvider } from "@/lib/store"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face" })

export const metadata: Metadata = {
  title: { default: "CoralDAC", template: "%s · CoralDAC" },
  description:
    "Detect coral colonies in reef quadrat photos (YOLOv8), classify their health (ResNet50: LC, PB, DC, DCA) and map the counts per monitoring station.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delay={300}>
            <StoreProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0">
                  <SiteHeader />
                  <div className="flex flex-1 flex-col">{children}</div>
                </SidebarInset>
              </SidebarProvider>
            </StoreProvider>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
