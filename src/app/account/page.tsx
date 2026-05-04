'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'

export default function AccountPage() {
  const { user, loading, signOut } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (loading || !user) return null

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <SiteHeader
        title="Account"
        user={user}
        onAccountClick={() => {}}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-6 py-8 space-y-8">

          {/* Account info */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
            <div className="border border-border rounded-lg divide-y divide-border">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-xs font-medium">{user.email}</span>
              </div>
            </div>
          </section>

          {/* Session */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session</h2>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </section>

        </div>
      </div>

      <SiteFooter user={user} onAccountClick={() => {}} />
    </div>
  )
}
