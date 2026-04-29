'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface SiteHeaderProps {
  title: string
  remaining?: number
  onNewTask?: () => void
}

const navLinkCls = 'text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
const menuRowCls = 'flex items-center w-full text-sm px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left'

export function SiteHeader({ title, remaining, onNewTask }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  const close = () => setMenuOpen(false)

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
              Back to tasks
            </Link>
          )}
          <Link href="/changelog" className={navLinkCls}>Changelog</Link>
          <Link href="/stats" className={navLinkCls}>Stats</Link>
          {onNewTask && (
            <button
              onClick={onNewTask}
              className="text-xs px-2.5 py-1 rounded-md bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              New task
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile dropdown — fixed so it escapes overflow:hidden on the page container */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 sm:hidden" onClick={close} />
          <div className="fixed top-[53px] left-0 right-0 z-50 bg-background border-b border-border shadow-md sm:hidden">
            {remaining !== undefined && (
              <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50">
                {remaining} remaining
              </div>
            )}
            {!isHome && (
              <Link href="/" onClick={close} className={menuRowCls}>
                Back to tasks
              </Link>
            )}
            {onNewTask && (
              <button onClick={() => { onNewTask(); close() }} className={menuRowCls}>
                New task
              </button>
            )}
            <Link href="/stats" onClick={close} className={menuRowCls}>Stats</Link>
            <Link href="/changelog" onClick={close} className={menuRowCls}>Changelog</Link>
          </div>
        </>
      )}
    </>
  )
}
