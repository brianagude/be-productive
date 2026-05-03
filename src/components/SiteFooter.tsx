import Link from 'next/link'
import { type User } from '@supabase/supabase-js'

interface SiteFooterProps {
  user?: User | null
  onAccountClick?: () => void
}

export function SiteFooter({ onAccountClick }: SiteFooterProps) {
  return (
    <footer className="shrink-0 bg-black flex items-center justify-between px-4 py-3">
      <span className="text-sm text-white/50 font-medium">Be Productive</span>
      <div className="hidden items-center gap-4 sm:flex">
        <Link href="/" className="text-sm text-white/50 hover:text-white/60 transition-colors">
          Tasks
        </Link>
        <Link href="/stats" className="text-sm text-white/50 hover:text-white/60 transition-colors">
          Stats
        </Link>
        <button
          onClick={onAccountClick}
          className="text-sm text-white/50 hover:text-white/60 transition-colors cursor-pointer"
        >
          Account
        </button>
        <Link href="/changelog" className="text-sm text-white/50 hover:text-white/60 transition-colors">
          Changelog
        </Link>
      </div>
      <a
        href="https://www.brianagude.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/50 hover:text-white/60 transition-colors"
      >
        Built by Bri
      </a>
    </footer>
  )
}
