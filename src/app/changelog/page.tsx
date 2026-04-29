import { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

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
      'Navigation is now shared across all pages with a mobile-friendly menu',
      'Empty task list now shows a button to create your first task',
      'Timer moved into a modal — open it from the header on any page',
      'Added a footer with links to Stats, Changelog, and brianagude.com',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <SiteHeader title="Changelog" />

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
                    <span className="mt-1.25 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
