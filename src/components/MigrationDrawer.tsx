'use client'

import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { SLOTS } from '@/lib/types'
import { readLegacyTasks, clearLegacyData } from '@/lib/legacyMigration'

interface MigrationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (texts: string[]) => void
}

export function MigrationDrawer({ open, onOpenChange, onImport }: MigrationDrawerProps) {
  const [tasks, setTasks] = useState<string[]>([])
  const [checked, setChecked] = useState<boolean[]>([])

  useEffect(() => {
    if (!open) return
    const found = readLegacyTasks()
    setTasks(found)
    setChecked(found.map((_, i) => i < SLOTS))
  }, [open])

  const selected = checked.filter(Boolean).length

  const toggle = (i: number) => {
    setChecked(prev => {
      if (!prev[i] && prev.filter(Boolean).length >= SLOTS) return prev
      const next = prev.slice()
      next[i] = !next[i]
      return next
    })
  }

  const doImport = () => {
    onImport(tasks.filter((_, i) => checked[i]).slice(0, SLOTS))
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
              Found {tasks.length} task{tasks.length === 1 ? '' : 's'} from the old version. Pick which
              to keep (up to {SLOTS}) — they land on a new card, text only.
            </Drawer.Description>

            {tasks.length === 0 ? (
              <p className="mt-4 text-sm text-ink-45">Nothing to import.</p>
            ) : (
              <ul className="mt-4 space-y-0.5">
                {tasks.map((text, i) => {
                  const on = checked[i]
                  const capped = !on && selected >= SLOTS
                  return (
                    <li key={i}>
                      <label
                        className={`flex items-center gap-2 text-sm ${capped ? 'opacity-40' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!on}
                          disabled={capped}
                          onChange={() => toggle(i)}
                        />
                        <span className="truncate">{text}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
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
