import { CardsState, CardState, Task, SLOTS, SMILEYS } from './types'

const CARDS_KEY = 'bp:cards'
const ACTIVE_KEY = 'bp:cards:active'

// ── Factories ────────────────────────────────────────────────────────────────

export function emptyTask(): Task {
  return { text: '', done: false, important: false }
}

/** Local calendar date as YYYY-MM-DD. */
export function todayISO(at: Date = new Date()): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(
    at.getDate(),
  ).padStart(2, '0')}`
}

function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function randomSmiley(): string {
  return SMILEYS[Math.floor(Math.random() * SMILEYS.length)]
}

export function newCard(): CardState {
  return {
    id: uid(),
    title: 'TO DO',
    description: '',
    date: todayISO(),
    smiley: randomSmiley(),
    tasks: Array.from({ length: SLOTS }, emptyTask),
  }
}

export function blankCards(): CardsState {
  return [newCard()]
}

// ── Read / write ─────────────────────────────────────────────────────────────

function normTask(t: Partial<Task> | undefined): Task {
  return {
    text: typeof t?.text === 'string' ? t.text : '',
    done: !!t?.done,
    important: !!t?.important,
  }
}

function normCard(c: Partial<CardState> | undefined): CardState {
  const base = newCard()
  return {
    id: typeof c?.id === 'string' && c.id ? c.id : base.id,
    title: typeof c?.title === 'string' ? c.title : base.title,
    description: typeof c?.description === 'string' ? c.description : base.description,
    date: typeof c?.date === 'string' && c.date ? c.date : base.date,
    smiley:
      typeof c?.smiley === 'string' && (SMILEYS as readonly string[]).includes(c.smiley)
        ? c.smiley
        : base.smiley,
    tasks: Array.from({ length: SLOTS }, (_, i) => normTask(c?.tasks?.[i])),
  }
}

export function getCards(): CardsState {
  if (typeof window === 'undefined') return blankCards()
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (!raw) return blankCards()
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      const cards = parsed.map(normCard)
      return cards.length ? cards : blankCards()
    }

    // migrate the old { today, daily, weekly } shape → a flat list
    if (parsed && typeof parsed === 'object') {
      const legacy = ['today', 'daily', 'weekly']
        .map(k => parsed[k])
        .filter(Boolean)
        .map(normCard)
      return legacy.length ? legacy : blankCards()
    }

    return blankCards()
  } catch {
    return blankCards()
  }
}

export function saveCards(cards: CardsState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

// ── Active card ──────────────────────────────────────────────────────────────
// The last card the user was looking at, so the deck reopens where they left off.

export function getActiveId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_KEY) || null
  } catch {
    return null
  }
}

export function saveActiveId(id: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}
