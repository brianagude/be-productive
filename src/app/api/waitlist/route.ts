import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const res = await fetch('https://app.loops.so/api/v1/contacts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
    },
    body: JSON.stringify({ email, source: 'waitlist', userGroup: 'Be Productive Waitlist' }),
  })

  // Loops returns 409 if the contact already exists — treat that as success
  if (!res.ok && res.status !== 409) {
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
