"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClassBar } from "@/components/class-ui"
import { formatDate } from "@/components/image/image-detail"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { stationById } from "@/lib/archive"
import { countClasses, totalOf } from "@/lib/classes"
import { useStore } from "@/lib/store"
import type { ImageStatus } from "@/lib/types"

export const MY_NAME = "You (demo)"

export function MyUploads() {
  const { images } = useStore()
  const router = useRouter()
  const mine = images.filter((i) => i.provenance.uploader === MY_NAME)
  const [filter, setFilter] = React.useState<"all" | ImageStatus>("all")
  const shown = filter === "all" ? mine : mine.filter((i) => i.status === filter)
  const count = (s: ImageStatus) => mine.filter((i) => i.status === s).length

  const action = (
    <Button nativeButton={false} render={<Link href="/upload" />}>
      <Upload /> Upload photos
    </Button>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <PageHeader title="My uploads" description="Photos you sent from this browser and where they are in the review." actions={mine.length > 0 && action} />
      {mine.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Upload />
            </EmptyMedia>
            <EmptyTitle>No uploads yet</EmptyTitle>
            <EmptyDescription>Upload quadrat photos from a survey; they will be listed here while they wait for review.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{action}</EmptyContent>
        </Empty>
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All {mine.length}</TabsTrigger>
              <TabsTrigger value="pending">Waiting {count("pending")}</TabsTrigger>
              <TabsTrigger value="approved">Approved {count("approved")}</TabsTrigger>
              <TabsTrigger value="rejected">Rejected {count("rejected")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="hidden md:table-cell">Station</TableHead>
                  <TableHead className="hidden sm:table-cell">Colonies</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((img) => {
                  const c = countClasses(img.detections)
                  return (
                    <TableRow key={img.id} className="cursor-pointer" onClick={() => router.push(`/images/${img.id}`)}>
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
                        <StatusBadge status={img.status} />
                        {img.provenance.review?.reason && <div className="mt-1 text-xs text-muted-foreground">{img.provenance.review.reason}</div>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
