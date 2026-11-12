"use client"

import * as React from "react"
import { Loader2, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"

/**
 * Username + password sign-in with accounts made by the project (no sign-up, no e-mails; V2-0376). Needed only to upload;
 * viewing the map and photos stays open to everyone.
 */
export function SignInCard({ title = "Sign in to upload" }: { title?: string }) {
  const { signIn } = useStore()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(username, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Use the account you were given. Only the account that uploaded a photo can correct or delete it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-user">Username</Label>
            <Input id="signin-user" required autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signin-pass">Password</Label>
            <Input id="signin-pass" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || !username || !password}>
            {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SignOutButton() {
  const { user, signOut } = useStore()
  if (!user) return null
  const name = user.email?.replace(/@coraldac\.local$/, "")
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()} title={name ?? undefined}>
      <LogOut /> Sign out{name ? ` (${name})` : ""}
    </Button>
  )
}
