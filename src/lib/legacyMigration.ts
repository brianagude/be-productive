const LEGACY_PREFIX = 'tiny-tools:'

interface LegacyTodo {
  title?: string
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

/** Flat list of task titles from the old app. */
export function readLegacyTasks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LEGACY_PREFIX + 'todos')
    const todos: LegacyTodo[] = raw ? JSON.parse(raw) : []
    return todos.map(t => (t.title ?? '').trim()).filter(Boolean)
  } catch {
    return []
  }
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
