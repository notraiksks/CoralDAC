"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import type { ReefImage } from "@/lib/types"

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
              await removeUpload(img.id)
              setOpen(false)
              toast.success(`${img.file} deleted`)
              onDeleted?.()
            }}
          >
            <Trash2 /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
