import { NextRequest, NextResponse } from 'next/server'

// Posts an email to Loops. Used by <EmailSignup>. Needs LOOPS_API_KEY in the
// environment. Not linked from any page by default — drop <EmailSignup> wherever
// you want a signup form.

const DEFAULT_SOURCE = 'waitlist'
const DEFAULT_GROUP = 'Be Productive Waitlist'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = body?.email
  const source = typeof body?.source === 'string' ? body.source : DEFAULT_SOURCE
  const userGroup = typeof body?.userGroup === 'string' ? body.userGroup : DEFAULT_GROUP

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (!process.env.LOOPS_API_KEY) {
    return NextResponse.json({ error: 'Signup is not configured' }, { status: 503 })
  }

  const res = await fetch('https://app.loops.so/api/v1/contacts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
    },
    body: JSON.stringify({ email, source, userGroup }),
  })

  // Loops returns 409 if the contact already exists — treat that as success
  if (!res.ok && res.status !== 409) {
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
