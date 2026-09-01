'use client'

import Image from 'next/image'
import { CardState } from '@/lib/types'
import { TaskRow } from './TaskRow'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** YYYY-MM-DD → "November, 29, 2026" (parsed as a local date, no TZ shift). */
function formatCardDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? '' : `${MONTHS[d.getMonth()]}, ${d.getDate()}, ${d.getFullYear()}`
}

interface CardProps {
  card: CardState
  onMeta: (patch: { title?: string; description?: string }) => void
  onText: (index: number, text: string) => void
  onToggleDone: (index: number) => void
  onToggleImportant: (index: number) => void
}

export function Card({ card, onMeta, onText, onToggleDone, onToggleImportant }: CardProps) {
  return (
    <section className="bg-ink-100 shadow-[1px_0_3px_0_rgba(0,0,0,0.10)] w-full max-w-112">
      <div className="border-b border-ink-0">
        <div className="pt-8 pb-6 px-4 relative">
          <input
            value={card.title}
            onChange={e => onMeta({ title: e.target.value })}
            aria-label="Card title"
            className="outline-none text-center w-full text-4xl font-medium sm:text-5xl"
            maxLength={10}
          />
        </div>
        <div className="border-t border-ink-0 flex flex-col py-1 px-2">
          <label className="text-[10px] font-semibold uppercase" htmlFor={`desc-${card.id}`}>
            Description
          </label>
          <input
            id={`desc-${card.id}`}
            value={card.description}
            onChange={e => onMeta({ description: e.target.value })}
            aria-label="Card description"
            className="outline-none"
          />
        </div>
        <div className="border-t border-ink-0 flex flex-col py-1 px-2">
          <span className="text-[10px] font-semibold uppercase">Date</span>
          <span className="cursor-default">{formatCardDate(card.date)}</span>
        </div>
      </div>

      <div className="border-y border-ink-0 mt-0.5">
        <div className="w-full grid grid-cols-[40px_1fr_40px] h-7 bg-ink-90 border-b border-ink-0 items-center">
          <span><Image src="/check.svg" width={14} height={10} alt="" className="mx-auto" /></span>
          <span className="w-full h-full px-2 pt-1 border-x border-ink-0 text-sm font-semibold uppercase cursor-default">Task</span>
          <span><Image src="/priority.svg" width={3} height={16} alt="" className="mx-auto" /></span>
        </div>
        <div>
          {card.tasks.map((task, i) => (
            <TaskRow
              key={i}
              task={task}
              onText={text => onText(i, text)}
              onToggleDone={() => onToggleDone(i)}
              onToggleImportant={() => onToggleImportant(i)}
              classes={`${i % 2 ? 'bg-ink-95' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="py-1 border-t border-ink-0 mt-0.5">
        <Image src={`/smiley-${card.smiley}.svg`} width={12} height={12} alt="" className="mx-auto" />
      </div>
    </section>
  )
}
