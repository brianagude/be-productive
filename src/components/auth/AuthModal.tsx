'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Panel = 'login' | 'waitlist' | 'forgot'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [panel, setPanel] = useState<Panel>('login')

  function handleClose(open: boolean) {
    onOpenChange(open)
    if (!open) setTimeout(() => setPanel('login'), 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xs">
        {panel === 'login' ? (
          <LoginPanel onWaitlist={() => setPanel('waitlist')} onForgot={() => setPanel('forgot')} onSuccess={() => handleClose(false)} />
        ) : panel === 'waitlist' ? (
          <WaitlistPanel onBack={() => setPanel('login')} />
        ) : (
          <ForgotPanel onBack={() => setPanel('login')} />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Login panel ────────────────────────────────────────────────────────────────

function LoginPanel({
  onWaitlist,
  onForgot,
  onSuccess,
}: {
  onWaitlist: () => void
  onForgot: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onSuccess()
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Sign in</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onWaitlist}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          Need to create an account? →
        </button>
      </div>
    </>
  )
}

// ── Waitlist panel ─────────────────────────────────────────────────────────────

function WaitlistPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setState('loading')
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      setState('idle')
      setError('Something went wrong. Try again.')
    } else {
      setState('success')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Join the waitlist</DialogTitle>
      </DialogHeader>
      {state === 'success' ? (
        <p className="text-xs text-muted-foreground">You&apos;re on the list! We&apos;ll reach out when spots open.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Sign-in is currently in beta and available by invitation only. Leave your email and we&apos;ll reach out when spots open.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Sync tasks across any browser or device</li>
            <li>Never lose your task history</li>
            <li>Richer productivity stats over time</li>
          </ul>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={state === 'loading'}>
              {state === 'loading' ? 'Joining…' : 'Join waitlist'}
            </Button>
          </form>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
      >
        ← Back to sign in
      </button>
    </>
  )
}

// ── Forgot password panel ──────────────────────────────────────────────────────

function ForgotPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setState('loading')
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/confirm`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setState(error ? 'idle' : 'success')
    if (error) setError(error.message)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset your password</DialogTitle>
      </DialogHeader>
      {state === 'success' ? (
        <p className="text-xs text-muted-foreground">Check your email for a reset link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={state === 'loading'}>
            {state === 'loading' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
      >
        ← Back to sign in
      </button>
    </>
  )
}
