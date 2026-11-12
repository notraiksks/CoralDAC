import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default function NotFound() {
  return (
    <Empty className="m-6 border">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>The address does not match a page of CoralDAC.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" nativeButton={false} render={<Link href="/" />}>
          Reef map
        </Button>
      </EmptyContent>
    </Empty>
  )
}
