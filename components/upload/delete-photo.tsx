"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import type { ReefImage } from "@/lib/types"

/**
 * V2-0479: delete several of the uploader's photos at once (My uploads selection). One confirmation; the photos are deleted 4 at a
 * time through the same API as one photo; the ones that fail stay selected and are named in the message.
 */
export function DeleteManyButton({ photos, onDone }: { photos: ReefImage[]; onDone: (failedIds: string[]) => void }) {
  const { removeUpload } = useStore()
  const [open, setOpen] = React.useState(false)
  const [progress, setProgress] = React.useState<number | null>(null)
  const n = photos.length
  const run = async () => {
    setProgress(0)
    const failed: { img: ReefImage; msg: string }[] = []
    let next = 0
    let done = 0
    const worker = async () => {
      while (next < photos.length) {
        const img = photos[next++]
        try {
          await removeUpload(img.id)
        } catch (e) {
          failed.push({ img, msg: e instanceof Error ? e.message : "failed" })
        }
        setProgress(++done)
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, photos.length) }, worker))
    setProgress(null)
    setOpen(false)
    const ok = n - failed.length
    if (ok) toast.success(`${ok} photo${ok === 1 ? "" : "s"} deleted`)
    if (failed.length)
      toast.error(`${failed.length} photo${failed.length === 1 ? " was" : "s were"} not deleted`, {
        description: `${failed[0].img.file}: ${failed[0].msg}${failed.length > 1 ? ` (and ${failed.length - 1} more)` : ""}`,
      })
    onDone(failed.map((f) => f.img.id))
  }
  return (
    <Dialog open={open} onOpenChange={(o) => progress === null && setOpen(o)}>
      <DialogTrigger render={<Button variant="destructive" size="sm" disabled={n === 0} />}>
        <Trash2 /> Delete {n} selected
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {n} photo{n === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            The photos and their colonies are removed from the map and the station counts. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
          {photos.slice(0, 50).map((p) => (
            <li key={p.id} className="truncate">
              {p.file}
            </li>
          ))}
          {n > 50 && <li>…and {n - 50} more</li>}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={progress !== null} />}>Cancel</DialogClose>
          <Button variant="destructive" disabled={progress !== null} onClick={run}>
            <Trash2 /> {progress === null ? `Delete ${n}` : `Deleting ${progress} / ${n}…`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Delete button for the uploader of a photo (no curator: only the uploader removes their own photos). */
export function DeletePhotoButton({ img, iconOnly, onDeleted }: { img: ReefImage; iconOnly?: boolean; onDeleted?: () => void }) {
  const { removeUpload } = useStore()
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={iconOnly ? "ghost" : "outline"}
            size={iconOnly ? "icon-sm" : "sm"}
            aria-label={`Delete ${img.file}`}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <Trash2 />
        {!iconOnly && "Delete photo"}
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Delete {img.file}?</DialogTitle>
          <DialogDescription>The photo and its colonies are removed from the map and the station counts. This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await removeUpload(img.id)
                setOpen(false)
                toast.success(`${img.file} deleted`)
                onDeleted?.()
              } catch (e) {
                toast.error(`${img.file} was not deleted`, { description: e instanceof Error ? e.message : undefined })
              }
            }}
          >
            <Trash2 /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
