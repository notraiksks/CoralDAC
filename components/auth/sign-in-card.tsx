"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HandHeart, Loader2, LogIn, LogOut, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"

/**
 * Contributor accounts (V2-0378): sign in or sign up with a username and password; e-mail is optional and never used to send
 * mail. Viewing the map and stations needs no account; uploading does.
 */
export function AuthForms({ onDone }: { onDone?: () => void }) {
  const { signIn, signUp } = useStore()
  const [tab, setTab] = React.useState<"signin" | "signup">("signin")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    let err: string | null
    try {
      err = tab === "signin" ? await signIn(username, password) : await signUp(username, password, email)
    } catch (x) {
      err = x instanceof Error ? x.message : "Could not reach the sign-in service."
    }
    setBusy(false)
    if (err) setError(err)
    else onDone?.()
  }

  const fields = (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${tab}-user`}>Username</Label>
        <Input id={`${tab}-user`} required autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${tab}-pass`}>Password</Label>
        <Input
          id={`${tab}-pass`}
          type="password"
          required
          autoComplete={tab === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  )

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as "signin" | "signup")
        setError(null)
      }}
    >
      <TabsList className="w-full">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Sign up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <form onSubmit={submit} className="space-y-3 pt-2">
          {fields}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="signup">
        <form onSubmit={submit} className="space-y-3 pt-2">
          {fields}
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">E-mail</Label>
            <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Create account
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}

/** The "Contribute" button: opens sign in / sign up, then goes to the upload page. */
export function ContributeButton({ className }: { className?: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button className={className} onClick={() => setOpen(true)} aria-label="Contribute">
        <HandHeart /> <span className="group-data-[collapsible=icon]:hidden">Contribute</span>
      </Button>
      <ContributeDialog
        open={open}
        onOpenChange={setOpen}
        onDone={() => {
          setOpen(false)
          router.push("/upload")
        }}
      />
    </>
  )
}

export function ContributeDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contribute survey photos</DialogTitle>
          <DialogDescription>
            Sign in or create an account to upload quadrat photos.
          </DialogDescription>
        </DialogHeader>
        <AuthForms onDone={onDone} />
      </DialogContent>
    </Dialog>
  )
}

/** Shown on /upload and /uploads when someone opens them directly without signing in. */
export function SignInCard({ title = "Sign in to upload" }: { title?: string }) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Sign in or create an account to upload quadrat photos.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForms />
      </CardContent>
    </Card>
  )
}

export function SignOutButton() {
  const { user, signOut } = useStore()
  if (!user) return null
  const name = user.email?.replace(/@coraldac\.local$/, "")
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()} title={name ? `Signed in as ${name}` : undefined}>
      <LogOut /> Sign out
    </Button>
  )
}
