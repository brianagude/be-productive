import { CardKind, CardsState, CardState, Task, SLOTS } from './types'

const CARDS_KEY = 'bp:cards'
const RESETS_KEY = 'bp:resets'

/** Day boundary: anything before 3am counts as the previous day. */
const RESET_HOUR = 3

const DEFAULT_META: Record<CardKind, { title: string; description: string }> = {
  today: { title: 'TO DO', description: 'Items due today' },
  daily: { title: 'TO DO', description: 'Items due daily' },
  weekly: { title: 'TO DO', description: 'Items due this week' },
}

// ── Factories ─────────────────────────────────────────────────────────────────

export function emptyTask(): Task {
  return { text: '', done: false, important: false }
}

export function blankCard(kind: CardKind): CardState {
  return {
    ...DEFAULT_META[kind],
    tasks: Array.from({ length: SLOTS }, emptyTask),
  }
}

export function blankCards(): CardsState {
  return { today: blankCard('today'), daily: blankCard('daily'), weekly: blankCard('weekly') }
}

// ── Read / write ─────────────────────────────────────────────────────────────

function normTask(t: Partial<Task> | undefined): Task {
  return {
    text: typeof t?.text === 'string' ? t.text : '',
    done: !!t?.done,
    important: !!t?.important,
  }
}

function normCard(kind: CardKind, c: Partial<CardState> | undefined): CardState {
  const base = blankCard(kind)
  return {
    title: typeof c?.title === 'string' ? c.title : base.title,
    description: typeof c?.description === 'string' ? c.description : base.description,
    tasks: Array.from({ length: SLOTS }, (_, i) => normTask(c?.tasks?.[i])),
  }
}

export function getCards(): CardsState {
  if (typeof window === 'undefined') return blankCards()
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      today: normCard('today', parsed.today),
      daily: normCard('daily', parsed.daily),
      weekly: normCard('weekly', parsed.weekly),
    }
  } catch {
    return blankCards()
  }
}

export function saveCards(cards: CardsState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

// ── Date math ────────────────────────────────────────────────────────────────

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Calendar date (YYYY-MM-DD) that `at` belongs to, with a 3am day boundary. */
export function resetDay(at: number = Date.now()): string {
  return ymd(new Date(at - RESET_HOUR * 60 * 60 * 1000))
}

/** Monday (YYYY-MM-DD) of the week containing reset-day `day`. Week runs Mon–Sun. */
export function mondayOf(day: string): string {
  const d = new Date(day + 'T12:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return ymd(d)
}

/** The automatic date line shown on a card. */
export function formatCardDate(kind: CardKind, at: number = Date.now()): string {
  if (kind === 'weekly') {
    const mon = new Date(mondayOf(resetDay(at)) + 'T12:00:00')
    return `Week of ${mon.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
  }
  return new Date(at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── Resets ───────────────────────────────────────────────────────────────────

export interface ResetStamps {
  today: string // reset-day
  daily: string // reset-day
  weekly: string // Monday of the last reset week
}

export function getResets(): ResetStamps {
  const day = resetDay()
  const fresh: ResetStamps = { today: day, daily: day, weekly: mondayOf(day) }
  if (typeof window === 'undefined') return fresh
  try {
    const raw = localStorage.getItem(RESETS_KEY)
    if (!raw) return fresh
    const p = JSON.parse(raw)
    return {
      today: typeof p.today === 'string' ? p.today : day,
      daily: typeof p.daily === 'string' ? p.daily : day,
      weekly: typeof p.weekly === 'string' ? p.weekly : mondayOf(day),
    }
  } catch {
    return fresh
  }
}

export function saveResets(r: ResetStamps): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RESETS_KEY, JSON.stringify(r))
}

/** Drop empty-text tasks, keep order, pad back to SLOTS with empty tasks. */
function compact(tasks: Task[]): Task[] {
  const filled = tasks.filter(t => t.text.trim() !== '').slice(0, SLOTS)
  while (filled.length < SLOTS) filled.push(emptyTask())
  return filled
}

/**
 * Bring cards up to date for any reset boundaries crossed since `resets`.
 * - Today: drop `done` tasks, compact survivors to the top.
 * - Daily: clear `done` on every slot; keep text + important.
 * - Weekly: same as Daily, but only on the Mon (Sun→Mon 3am) boundary.
 */
export function applyResets(
  cards: CardsState,
  resets: ResetStamps,
  at: number = Date.now(),
): { cards: CardsState; resets: ResetStamps; changed: boolean } {
  const day = resetDay(at)
  const monday = mondayOf(day)
  const next: CardsState = { ...cards }
  const nextResets: ResetStamps = { ...resets }
  let changed = false

  if (resets.today !== day) {
    next.today = { ...cards.today, tasks: compact(cards.today.tasks.filter(t => !t.done)) }
    nextResets.today = day
    changed = true
  }

  if (resets.daily !== day) {
    next.daily = { ...cards.daily, tasks: cards.daily.tasks.map(t => ({ ...t, done: false })) }
    nextResets.daily = day
    changed = true
  }

  if (resets.weekly !== monday) {
    next.weekly = { ...cards.weekly, tasks: cards.weekly.tasks.map(t => ({ ...t, done: false })) }
    nextResets.weekly = monday
    changed = true
  }

  return { cards: next, resets: nextResets, changed }
}
