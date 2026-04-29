import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog',
}

const entries: { date: string; items: string[] }[] = [
  {
    date: 'April 29, 2026',
    items: [
      'Sections are now collapsible',
      'Added a Backlog that stays hidden until you need it',
      'You can now drag tasks between sections',
      'Task notes are shown on the focus screen while you work',
      'Switched to Phosphor icons throughout',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Changelog</h1>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Back to tasks
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-10">
          {entries.map(entry => (
            <section key={entry.date}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {entry.date}
              </h2>
              <ul className="space-y-2">
                {entry.items.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-[5px] w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
