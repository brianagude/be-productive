'use client'

import { useId, useState } from 'react'

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
        <p style={{ fontWeight: 600 }}>{successTitle}</p>
        <p>{successMessage}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {(heading || description) && (
        <div style={{ marginBottom: '0.75rem' }}>
          {heading && <h2 style={{ fontWeight: 600 }}>{heading}</h2>}
          {description && <p>{description}</p>}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '20rem' }}
      >
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
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
          style={{ padding: '0.5rem', border: '1px solid currentColor', borderRadius: '0.25rem' }}
        />
        {error && (
          <p role="alert" style={{ color: 'crimson' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{ padding: '0.5rem', border: '1px solid currentColor', borderRadius: '0.25rem' }}
        >
          {status === 'loading' ? loadingLabel : buttonLabel}
        </button>
      </form>
    </div>
  )
}
