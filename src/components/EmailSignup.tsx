'use client'

import { useId, useState } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface EmailSignupProps {
  /** Small heading above the form. Pass null to hide it. */
  heading?: string | null
  /** Supporting line under the heading. Pass null to hide it. */
  description?: string | null
  buttonLabel?: string
  loadingLabel?: string
  placeholder?: string
  /** Shown after a successful submit. */
  successTitle?: string
  successMessage?: string
  /** Forwarded to Loops via /api/waitlist. */
  source?: string
  userGroup?: string
  /** Fired after a successful submit, with the email that was sent. */
  onSuccess?: (email: string) => void
  className?: string
}

type Status = 'idle' | 'loading' | 'success'

export function EmailSignup({
  heading = 'Join the waitlist',
  description = "Leave your email and we'll reach out when spots open.",
  buttonLabel = 'Join waitlist',
  loadingLabel = 'Joining…',
  placeholder = 'you@example.com',
  successTitle = "You're on the list!",
  successMessage = "Thanks for signing up — we'll be in touch when there's news.",
  source,
  userGroup,
  onSuccess,
  className,
}: EmailSignupProps) {
  const inputId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }

    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source, userGroup }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong. Try again.')
      }
      setStatus('success')
      onSuccess?.(trimmed)
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className={className} aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">{successTitle}</p>
            <p className="text-xs text-muted-foreground">{successMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {(heading || description) && (
        <div className="mb-3 space-y-1">
          {heading && <h2 className="text-sm font-semibold">{heading}</h2>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          aria-invalid={!!error}
          disabled={status === 'loading'}
          required
        />
        {error && (
          <p className="text-xs text-destructive" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? loadingLabel : buttonLabel}
        </Button>
      </form>
    </div>
  )
}
