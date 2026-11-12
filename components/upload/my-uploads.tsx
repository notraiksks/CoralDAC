"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleCheck, CircleDashed, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClassBar } from "@/components/class-ui"
import { formatDate } from "@/components/image/image-detail"
import { PageHeader } from "@/components/page-header"
import { DeletePhotoButton } from "@/components/upload/delete-photo"
import { stationById } from "@/lib/archive"
import { countClasses, totalOf } from "@/lib/classes"
import { useStore } from "@/lib/store"

export const MY_NAME = "You"

export function MyUploads() {
  const { images, isOwn } = useStore()
  const router = useRouter()
  const mine = images.filter(isOwn)

  const action = (
    <Button nativeButton={false} render={<Link href="/upload" />}>
      <Upload /> Upload photos
    </Button>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <PageHeader
        title="My uploads"
        description="Photos you uploaded from this browser. They count on the map as soon as they have a station; open one to correct a class or delete it."
        actions={mine.length > 0 && action}
      />
      {mine.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Upload />
            </EmptyMedia>
            <EmptyTitle>No uploads yet</EmptyTitle>
            <EmptyDescription>Upload quadrat photos from a survey; they will be listed here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{action}</EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
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
                      {img.stationId ? (
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
      )}
    </div>
  )
}
