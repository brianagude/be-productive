'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { type User } from '@supabase/supabase-js'
import { UserIcon } from '@/components/icons/UserSquareIcon'

interface SiteHeaderProps {
  title: string
  remaining?: number
  onNewTask?: () => void
  onOpenTimer?: () => void
  user?: User | null
  onAccountClick?: () => void
}

const menuRowCls = 'flex items-center w-full text-sm px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left'

export function SiteHeader({ title, remaining, onNewTask, onOpenTimer, user, onAccountClick }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'

  const close = () => setMenuOpen(false)

  const handleNewTask = () => {
    if (onNewTask) { onNewTask() } else { router.push('/#new') }
  }

  const handleTimer = () => {
    if (onOpenTimer) { onOpenTimer() } else { router.push('/#timer') }
  }

  return (
    <>
      <header className="p-4 border-b border-border shrink-0 flex items-center justify-between">
        <h1 className="text-sm font-semibold">{title}</h1>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {isHome && remaining !== undefined && (
            <span className="text-xs text-muted-foreground">{remaining} remaining</span>
          )}
          {!isHome && (
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Your Tasks
            </Link>
          )}
          <button
            onClick={handleTimer}
            className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            Timer
          </button>
          <button
            onClick={handleNewTask}
            className="text-xs px-2.5 py-1 rounded-md bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            New task
          </button>
          <button
            onClick={onAccountClick}
            aria-label="Account"
            className="cursor-pointer transition-colors"
          >
            {user && (
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center leading-none">
                {user.email?.[0].toUpperCase()}
              </span>
            )}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile dropdown — fixed so it escapes overflow:hidden on the page container */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer sm:hidden" onClick={close} />
          <div className="fixed top-[53px] left-0 right-0 z-50 bg-background border-b border-border shadow-md sm:hidden">
            {remaining !== undefined && (
              <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50">
                {remaining} tasks remaining
              </div>
            )}
            {!isHome && (
              <Link href="/" onClick={close} className={menuRowCls}>Your Tasks</Link>
            )}
            <button onClick={() => { handleNewTask(); close() }} className={menuRowCls}>
              New task
            </button>
            <button onClick={() => { handleTimer(); close() }} className={menuRowCls}>
              Timer
            </button>
            <button onClick={() => { onAccountClick?.(); close() }} className={menuRowCls}>
              Account {user ? '·' : ''}
            </button>
            <Link href="/stats" className={menuRowCls}>
              Stats
            </Link>
            <Link href="/stats" className={menuRowCls}>
              Changelog
            </Link>
          </div>
        </>
      )}
    </>
  )
}
