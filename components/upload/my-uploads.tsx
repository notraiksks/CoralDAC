"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, CircleCheck, CircleDashed, Loader2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClassBar } from "@/components/class-ui"
import { formatDate } from "@/components/image/image-detail"
import { PageHeader } from "@/components/page-header"
import { Checkbox } from "@/components/ui/checkbox"
import { DeleteManyButton, DeletePhotoButton } from "@/components/upload/delete-photo"
import { imageCounts, totalOf } from "@/lib/classes"
import { useStore } from "@/lib/store"
import type { PhotoStatus } from "@/lib/types"
import { SignInCard } from "@/components/auth/sign-in-card"

export const MY_NAME = "You"

const STATUS_TEXT: Record<Exclude<PhotoStatus, "done">, string> = {
  uploading: "Uploading",
  queued: "Waiting for analysis",
  running: "Analyzing",
  failed: "Analysis failed",
}

export function StatusBadge({ status, error }: { status: Exclude<PhotoStatus, "done">; error?: string | null }) {
  if (status === "failed")
    return (
      <Badge variant="destructive" title={error ?? undefined}>
        <CircleAlert /> {STATUS_TEXT.failed}
      </Badge>
    )
  return (
    <Badge variant="secondary">
      <Loader2 className="animate-spin" /> {STATUS_TEXT[status]}
    </Badge>
  )
}

export function MyUploads() {
  const { myUploads: mine, user, stationById } = useStore()
  const router = useRouter()
  // V2-0479: several photos can be ticked and deleted together; ids of photos that are gone drop out by themselves
  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const selected = mine.filter((p) => picked.has(p.id))
  const allPicked = mine.length > 0 && selected.length === mine.length
  const toggle = (id: string, on: boolean) =>
    setPicked((s) => {
      const n = new Set(s)
      if (on) n.add(id)
      else n.delete(id)
      return n
    })

  if (!user)
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
        <PageHeader title="My uploads" description="Sign in to see the photos you uploaded." />
        <SignInCard title="Sign in to see your uploads" />
      </div>
    )

  const action = (
    <Button nativeButton={false} render={<Link href="/upload" />}>
      <Upload /> Upload photos
    </Button>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <PageHeader
        title="My uploads"
        description="Photos you uploaded. Each one is analyzed and counts on the map once it has a station. Open a photo to correct a class or delete it."
        actions={
          <div className="flex gap-2">
            {mine.length > 0 && action}
          </div>
        }
      />
      {mine.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Upload />
            </EmptyMedia>
            <EmptyTitle>No uploads yet</EmptyTitle>
            <EmptyDescription>Upload quadrat photos from a survey and they will be listed here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{action}</EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <span className="tabular font-medium">{selected.length} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>
              Clear
            </Button>
            <div className="ml-auto">
              <DeleteManyButton photos={selected} onDone={(failed) => setPicked(new Set(failed))} />
            </div>
          </div>
        )}
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label={allPicked ? "Unselect all photos" : "Select all photos"}
                    checked={allPicked}
                    indeterminate={selected.length > 0 && !allPicked}
                    onCheckedChange={(on) => setPicked(on && !allPicked ? new Set(mine.map((p) => p.id)) : new Set())}
                  />
                </TableHead>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="hidden md:table-cell">Station</TableHead>
                <TableHead className="hidden sm:table-cell">Colonies</TableHead>
                <TableHead>Map</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Delete</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((img) => {
                const c = imageCounts(img)
                return (
                  <TableRow
                    key={img.id}
                    className="cursor-pointer"
                    data-state={picked.has(img.id) ? "selected" : undefined}
                    onClick={() => router.push(`/images/${img.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`Select ${img.file}`} checked={picked.has(img.id)} onCheckedChange={(on) => toggle(img.id, on)} />
                    </TableCell>
                    <TableCell>
                      <span className="relative block size-11 overflow-hidden rounded-md bg-muted">
                        <Image src={img.thumb} alt="" fill sizes="44px" className="object-cover" unoptimized />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <Link href={`/images/${img.id}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                        {img.file}
                      </Link>
                      <span className="text-xs text-muted-foreground">Sent {formatDate(img.provenance.uploadedAt ?? img.date)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{stationById(img.stationId)?.name ?? "Not assigned"}</TableCell>
                    <TableCell className="hidden w-48 sm:table-cell">
                      <div className="tabular mb-1 text-xs">{totalOf(c)}</div>
                      <ClassBar counts={c} height="h-1.5" />
                    </TableCell>
                    <TableCell>
                      {img.status && img.status !== "done" ? (
                        <StatusBadge status={img.status} error={img.error} />
                      ) : img.stationId ? (
                        <Badge variant="secondary" className="bg-lc/12 text-foreground">
                          <CircleCheck /> On the map
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-pb/15 text-foreground">
                          <CircleDashed /> Needs a station
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeletePhotoButton img={img} iconOnly />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </div>
  )
}
