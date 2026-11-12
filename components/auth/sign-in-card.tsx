"use client"

import * as React from "react"
import { Loader2, LogOut, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"

/** E-mail link sign-in (no password). Needed only to upload; viewing the map and photos stays open to everyone. */
export function SignInCard({ next = "/upload", title = "Sign in to upload" }: { next?: string; title?: string }) {
  const { signIn } = useStore()
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = React.useState<string | null>(null)
  const failed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("signin") === "failed"

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setState("sending")
    setError(null)
    const err = await signIn(email.trim(), next)
    if (err) {
      setError(err)
      setState("idle")
    } else setState("sent")
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          We e-mail you a sign-in link; no password. Only you can correct or delete the photos you upload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === "sent" ? (
          <p className="text-sm">
            Check <strong>{email}</strong> for the sign-in link, then open it in this browser.
          </p>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">E-mail</Label>
              <Input id="signin-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {(error || failed) && <p className="text-sm text-destructive">{error ?? "That sign-in link did not work; request a new one."}</p>}
            <Button type="submit" disabled={state === "sending" || !email}>
              {state === "sending" ? <Loader2 className="animate-spin" /> : <Mail />} Send sign-in link
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export function SignOutButton() {
  const { user, signOut } = useStore()
  if (!user) return null
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()} title={user.email ?? undefined}>
      <LogOut /> Sign out
    </Button>
  )
}
