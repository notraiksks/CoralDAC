"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

/** Shown instead of a blank page when a page fails to render; the sidebar and header stay usable. */
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <Empty className="m-6 border">
      <EmptyHeader>
        <EmptyTitle>This page could not be shown</EmptyTitle>
        <EmptyDescription>Something went wrong while loading it. Your photos and results are not affected.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button size="sm" onClick={() => retry()}>
          <RotateCw /> Try again
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/" />}>
          Reef map
        </Button>
      </EmptyContent>
    </Empty>
  )
}
