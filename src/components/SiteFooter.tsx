import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="shrink-0 bg-black flex items-center justify-between px-4 py-3">
      <span className="text-sm text-white/50 font-medium">Be Productive</span>
      <div className="flex items-center gap-4">
        <Link href="/stats" className="text-sm text-white/50 hover:text-white/60 transition-colors">
          Stats
        </Link>
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
