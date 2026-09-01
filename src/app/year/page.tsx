'use client'

import { useEffect, useMemo, useState } from 'react'
import { completionsByDay } from '@/lib/completionsStorage'

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** YYYY-MM-DD → "September 1, 2026" (local, no TZ shift). */
function labelFor(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const plural = (n: number) => (n === 1 ? '' : 's')

type Cell =
  | { kind: 'month'; label: string; month: number }
  | { kind: 'day'; key: string; day: number; weekend: boolean; month: number }

const cellClasses = 'flex h-9 items-center justify-center px-2 text-center leading-none'

// Q1 pink · Q2 custard · Q3 moss · Q4 lilac. Literal class strings so Tailwind
// picks them up. base = month header, light = weekday with no completions,
// med = weekday with completions. Weekends get no background.
const QUARTER = [
  { base: 'bg-lilac', light: 'bg-lilac-light', med: 'bg-lilac-med' },
  { base: 'bg-moss', light: 'bg-moss-light', med: 'bg-moss-med' },
  { base: 'bg-custard', light: 'bg-custard-light', med: 'bg-custard-med' },
  { base: 'bg-pink', light: 'bg-pink-light', med: 'bg-pink-med' },
] as const

function quarterOf(month: number): 0 | 1 | 2 | 3 {
  return Math.floor(month / 3) as 0 | 1 | 2 | 3
}

export default function YearPage() {
  const year = new Date().getFullYear()

  // Client-only data — starts empty so SSR and first client render match,
  // then fills in after mount.
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [todayKey, setTodayKey] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setCounts(completionsByDay())
    setTodayKey(ymd(new Date()))
  }, [])

  const todayCount = todayKey ? counts[todayKey] ?? 0 : 0

  // The line under the year: today by default, the hovered day while hovering one.
  let message = ' '
  if (hovered) {
    const c = counts[hovered] ?? 0
    message =
      c > 0
        ? `You did ${c} thing${plural(c)} on ${labelFor(hovered)}`
        : `I don't have any data for ${labelFor(hovered)}`
  } else if (todayKey) {
    message =
      todayCount > 0
        ? `You've completed ${todayCount} thing${plural(todayCount)} today`
        : 'What are you doing today?'
  }

  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = []
    for (let m = 0; m < 12; m++) {
      out.push({ kind: 'month', label: new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' }), month: m })
      const days = new Date(year, m + 1, 0).getDate()
      for (let d = 1; d <= days; d++) {
        const date = new Date(year, m, d)
        const dow = date.getDay()
        out.push({ kind: 'day', key: ymd(date), day: d, weekend: dow === 0 || dow === 6, month: m })
      }
    }
    return out
  }, [year])

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold text-center">{year}</h1>

      <p className="mb-10 text-center text-sm text-ink-60">
        {message}
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,48px)] max-w-5xl mx-auto justify-center">
        {cells.map((cell, i) => {
          const q = QUARTER[quarterOf(cell.month)]

          if (cell.kind === 'month') {
            return (
              <div
                key={i}
                className={`col-span-2 ${cellClasses} ${q.med}`}
              >
                <span>{cell.label}</span>
              </div>
            )
          }

          const count = counts[cell.key] ?? 0
          const bg = cell.weekend ? 'text-ink-60' : count > 0 ? q.base : q.light

          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(cell.key)}
              onMouseLeave={() => setHovered(h => (h === cell.key ? null : h))}
              className={[
                `${cellClasses} tabular-nums`,
                bg,
                cell.key === todayKey ? 'font-bold text-ink-0!' : '',
              ].join(' ')}
            >
              <span>{cell.day}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}