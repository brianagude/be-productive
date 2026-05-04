'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Panel = 'login' | 'waitlist' | 'forgot'

export default function LoginPage() {
  const [panel, setPanel] = useState<Panel>('login')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/account')
    })
  }, [router])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Be Productive
        </Link>

        {panel === 'login' && (
          <LoginContent
            onWaitlist={() => setPanel('waitlist')}
            onForgot={() => setPanel('forgot')}
            onSuccess={() => router.replace('/')}
          />
        )}
        {panel === 'waitlist' && <WaitlistContent onBack={() => setPanel('login')} />}
        {panel === 'forgot' && <ForgotContent onBack={() => setPanel('login')} />}
      </div>
    </div>
  )
}

// ── Login ──────────────────────────────────────────────────────────────────────

function LoginContent({
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
    if (error) setError(error.message)
    else onSuccess()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-sm font-semibold">Sign in</h1>
        <p className="text-xs text-muted-foreground">Welcome back.</p>
      </div>
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
      <div className="flex flex-col gap-2">
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
    </div>
  )
}

// ── Waitlist ───────────────────────────────────────────────────────────────────

function WaitlistContent({ onBack }: { onBack: () => void }) {
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-sm font-semibold">Join the waitlist</h1>
        <p className="text-xs text-muted-foreground">
          Sign-in is currently in beta and available by invitation only. Leave your email and we&apos;ll reach out when spots open.
        </p>
      </div>

      {state === 'success' ? (
        <p className="text-xs text-muted-foreground">You&apos;re on the list! We&apos;ll reach out when spots open.</p>
      ) : (
        <>
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
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to sign in
      </button>
    </div>
  )
}

// ── Forgot password ────────────────────────────────────────────────────────────

function ForgotContent({ onBack }: { onBack: () => void }) {
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-sm font-semibold">Reset your password</h1>
        <p className="text-xs text-muted-foreground">We&apos;ll send a reset link to your email.</p>
      </div>

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
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to sign in
      </button>
    </div>
  )
}
