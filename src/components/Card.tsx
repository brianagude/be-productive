'use client'

import Image from 'next/image'
import { CardState } from '@/lib/types'
import { TaskRow } from './TaskRow'

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/** "2026-08-25" → "Monday, August 25th". Year is appended only when it isn't the current year. */
function formatCardDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return ''
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const base = `${weekday}, ${month} ${ordinal(d)}`
  return y === new Date().getFullYear() ? base : `${base}, ${y}`
}

interface CardProps {
  card: CardState
  onMeta: (patch: { title?: string; description?: string; date?: string }) => void
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
          <label className="text-[10px] font-semibold uppercase" htmlFor={`date-${card.id}`}>
            Date
          </label>
          <div className="relative">
            <span className="block">{formatCardDate(card.date)}</span>
            <input
              id={`date-${card.id}`}
              type="date"
              value={card.date}
              onChange={e => e.target.value && onMeta({ date: e.target.value })}
              onClick={e => e.currentTarget.showPicker?.()}
              aria-label="Card date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
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
