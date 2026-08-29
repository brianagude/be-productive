import { CardKind } from './types'

const LEGACY_PREFIX = 'tiny-tools:'

interface LegacyTodo {
  title?: string
  daily?: boolean
  weeklyDays?: number[]
}

/** True if any pre-redesign localStorage key is still present. */
export function hasLegacyData(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Object.keys(localStorage).some(k => k.startsWith(LEGACY_PREFIX))
  } catch {
    return false
  }
}

/** Legacy task titles grouped into the new card buckets. */
export function readLegacyBuckets(): Record<CardKind, string[]> {
  const out: Record<CardKind, string[]> = { today: [], daily: [], weekly: [] }
  if (typeof window === 'undefined') return out
  try {
    const raw = localStorage.getItem(LEGACY_PREFIX + 'todos')
    const todos: LegacyTodo[] = raw ? JSON.parse(raw) : []
    for (const t of todos) {
      const text = (t.title ?? '').trim()
      if (!text) continue
      if (t.daily) out.daily.push(text)
      else if (Array.isArray(t.weeklyDays) && t.weeklyDays.length > 0) out.weekly.push(text)
      else out.today.push(text)
    }
  } catch {
    /* ignore malformed legacy data */
  }
  return out
}

export function clearLegacyData(): void {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LEGACY_PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
