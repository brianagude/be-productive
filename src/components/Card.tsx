'use client'

import { useEffect, useState } from 'react'
import { CardKind, CardState } from '@/lib/types'
import { formatCardDate } from '@/lib/cardsStorage'
import { TaskRow } from './TaskRow'
import Image from "next/image"

interface CardProps {
  kind: CardKind
  card: CardState
  onMeta: (patch: { title?: string; description?: string }) => void
  onText: (index: number, text: string) => void
  onToggleDone: (index: number) => void
  onToggleImportant: (index: number) => void
}

export function Card({ kind, card, onMeta, onText, onToggleDone, onToggleImportant }: CardProps) {
  // Client-only so the SSR/hydration date strings can't disagree.
  const [dateLine, setDateLine] = useState('')

  useEffect(() => setDateLine(formatCardDate(kind)), [kind])
  const today = new Date()

    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const dayIcons: Record<string, string> = {
    monday: '/monday.svg',
    tuesday: '/tuesday.svg',
    wednesday: '/wednesday.svg',
    thursday: '/thursday.svg',
    friday: '/friday.svg',
    saturday: '/weekends.svg',
    sunday: '/weekends.svg',
  }

  const stamps: Record<string, string> = {
    daily: '/stamp-daily.svg',
    weekly: '/stamp-weekly.svg',
    today: '/stamp-today.svg',
  }

  return (
    <section className={`${kind == 'daily' ? 'rotate-1' : kind == 'weekly' ? '-rotate-2' : null} bg-ink-100 shadow-[1px_0_3px_0_rgba(0,0,0,0.10)] w-full max-w-120`}>
      <div className="border-b border-ink-0">
        <div className="pt-8 pb-6 px-4 relative">
          {/* <Image src={stamps[kind]} width={113} height={40} alt="" className="absolute top-8 right-4" /> */}
          <input
            value={card.title}
            onChange={e => onMeta({ title: e.target.value })}
            aria-label="Card title"
            className="outline-none text-center w-full text-4xl font-medium sm:text-5xl"
            maxLength={10}
          />
        </div>
        <div className="border-t border-ink-0 flex flex-col py-1 px-2">
          <label className="text-[10px] font-semibold uppercase">Description</label>
          <input
            value={card.description}
            onChange={e => onMeta({ description: e.target.value })}
            aria-label="Card description"
            className='outline-none'
          />
        </div>
        <div className="border-t border-ink-0 flex flex-col py-1 px-2">
          <p className="text-[10px] font-semibold uppercase cursor-default">Date</p>
          <p className="cursor-default">{dateLine}</p>
        </div>
      </div>

      <div className="border-y border-ink-0 mt-0.5">
        <div className="w-full grid grid-cols-[40px_1fr_40px] h-7 bg-ink-90 border-b border-ink-0 items-center">
          <span><Image src="/check.svg" width={14} height={10} alt='' className="mx-auto" /></span>
          <span className="w-full h-full px-2 pt-1 border-x border-ink-0 text-sm font-semibold uppercase cursor-default">Task</span>
          <span><Image src="/priority.svg" width={3} height={16} alt='' className="mx-auto" /></span>
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
        {kind == 'daily' && <Image src='/daily.svg' width={12} height={12} alt='' className='mx-auto' />}
        {kind == 'weekly' && <Image src='/weekly.svg' width={12} height={12} alt='' className='mx-auto' />}
        {kind == 'today' && <Image src={dayIcons[today]} width={12} height={12} alt='' className='mx-auto' />}
      </div>
    </section>
  )
}
