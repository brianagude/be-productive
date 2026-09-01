const COMPLETIONS_KEY = 'bp:completions'

/** Raw epoch-ms timestamps, one per task completion. Format however you like later. */
export function getCompletions(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((n: unknown): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

function save(list: number[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(list))
}

/** Tally one completion. Unchecking never removes one — re-checking counts again. */
export function pushCompletion(at: number = Date.now()): void {
  save([...getCompletions(), at])
}

/** Completion counts keyed by local YYYY-MM-DD. */
export function completionsByDay(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const ts of getCompletions()) {
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}
