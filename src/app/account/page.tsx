'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { exportCloudToLocal, downloadJson } from '@/lib/exportCloud'
import { toast } from 'sonner'

export default function AccountPage() {
  const { user, loading, signOut } = useAuthContext()
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState<{ todos: number; completions: number } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleExport = async () => {
    if (!user) return
    setExporting(true)
    try {
      const data = await exportCloudToLocal(user.id)
      downloadJson(data, `be-productive-backup-${data.exportedAt.slice(0, 10)}.json`)
      setExported({ todos: data.todos.length, completions: data.completions.length })
      toast.success(
        `Copied ${data.todos.length} task${data.todos.length === 1 ? '' : 's'} to this browser`,
        { duration: 4000 }
      )
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Export failed — check the console and try again')
    } finally {
      setExporting(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <SiteHeader
        title="Account"
        user={user}
        onAccountClick={() => { }}
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

          {/* Data export */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your data</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Copy everything in your account (tasks, completion history, tags and
              tag colors) into this browser&rsquo;s local storage and download a
              JSON backup. Run this on each device you use.
            </p>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export to this browser'}
            </Button>
            {exported && (
              <p className="text-xs text-muted-foreground">
                Copied {exported.todos} task{exported.todos === 1 ? '' : 's'} and{' '}
                {exported.completions} completion record{exported.completions === 1 ? '' : 's'}.
                A backup file was downloaded.
              </p>
            )}
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

      <SiteFooter user={user} onAccountClick={() => { }} />
    </div>
  )
}
