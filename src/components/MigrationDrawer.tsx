'use client'

import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { CARD_KINDS, CardKind, SLOTS } from '@/lib/types'
import { readLegacyBuckets, clearLegacyData } from '@/lib/legacyMigration'

interface MigrationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (kind: CardKind, texts: string[]) => void
}

const LABEL: Record<CardKind, string> = { today: 'Today', daily: 'Daily', weekly: 'Weekly' }

export function MigrationDrawer({ open, onOpenChange, onImport }: MigrationDrawerProps) {
  const [buckets, setBuckets] = useState<Record<CardKind, string[]>>({ today: [], daily: [], weekly: [] })
  const [checked, setChecked] = useState<Record<CardKind, boolean[]>>({ today: [], daily: [], weekly: [] })

  useEffect(() => {
    if (!open) return
    const b = readLegacyBuckets()
    setBuckets(b)
    const init = (arr: string[]) => arr.map((_, i) => i < SLOTS)
    setChecked({ today: init(b.today), daily: init(b.daily), weekly: init(b.weekly) })
  }, [open])

  const count = (kind: CardKind) => checked[kind].filter(Boolean).length
  const total = CARD_KINDS.reduce((n, k) => n + buckets[k].length, 0)

  const toggle = (kind: CardKind, i: number) => {
    setChecked(prev => {
      const cur = prev[kind]
      const selected = cur.filter(Boolean).length
      if (!cur[i] && selected >= SLOTS) return prev
      const next = cur.slice()
      next[i] = !next[i]
      return { ...prev, [kind]: next }
    })
  }

  const doImport = () => {
    for (const kind of CARD_KINDS) {
      const texts = buckets[kind].filter((_, i) => checked[kind][i]).slice(0, SLOTS)
      if (texts.length) onImport(kind, texts)
    }
    clearLegacyData()
    onOpenChange(false)
  }

  const doSkip = () => {
    clearLegacyData()
    onOpenChange(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink-0/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border-t border-ink-90 bg-ink-100 p-6 outline-none">
          <div className="mx-auto max-w-lg">
            <Drawer.Title className="text-lg">Bring your tasks over?</Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-ink-45">
              Found {total} task{total === 1 ? '' : 's'} from the old version. Pick which to keep
              (up to {SLOTS} per card) — only the text moves.
            </Drawer.Description>

            {total === 0 ? (
              <p className="mt-4 text-sm text-ink-45">Nothing to import.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {CARD_KINDS.map(kind =>
                  buckets[kind].length > 0 ? (
                    <div key={kind}>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-45">
                        {LABEL[kind]} · {count(kind)}/{SLOTS}
                      </div>
                      <ul className="space-y-0.5">
                        {buckets[kind].map((text, i) => {
                          const on = checked[kind][i]
                          const capped = !on && count(kind) >= SLOTS
                          return (
                            <li key={i}>
                              <label className={`flex items-center gap-2 text-sm ${capped ? 'opacity-40' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={on}
                                  disabled={capped}
                                  onChange={() => toggle(kind, i)}
                                />
                                <span className="truncate">{text}</span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button
                className="rounded border border-ink-75 px-3 py-1.5 text-sm hover:bg-ink-95"
                onClick={doImport}
              >
                Import selected
              </button>
              <button
                className="rounded px-3 py-1.5 text-sm text-ink-45 hover:bg-ink-95"
                onClick={doSkip}
              >
                Skip
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
