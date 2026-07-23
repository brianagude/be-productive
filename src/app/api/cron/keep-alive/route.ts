import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Any HTTP response back from Supabase (even a permission/RLS-related one)
  // proves the request reached its infrastructure, which is all that's needed
  // to register activity and prevent the free-tier project from auto-pausing.
  // Only a thrown error (e.g. DNS/connection failure) means the ping didn't land.
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/todos?select=id&limit=1`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    })
  } catch (err) {
    console.error('[cron/keep-alive] Could not reach Supabase:', err)
    return NextResponse.json({ ok: false }, { status: 502 })
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
}
