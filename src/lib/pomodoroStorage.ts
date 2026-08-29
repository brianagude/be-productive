const SETTINGS_KEY = 'bp:pomodoroSettings'
const FOCUS_KEY = 'bp:focus'

export interface PomodoroSettings {
  workMins: number
  breakMins: number
}

export interface FocusSession {
  at: number // epoch ms, when the session ended
  mins: number
}

const DEFAULTS: PomodoroSettings = { workMins: 25, breakMins: 5 }

// ── Settings ─────────────────────────────────────────────────────────────────

export function getPomodoroSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function savePomodoroSettings(s: PomodoroSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

// ── Focus log ────────────────────────────────────────────────────────────────

export function getFocus(): FocusSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FOCUS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function addFocusSession(mins: number, at: number = Date.now()): void {
  if (typeof window === 'undefined' || mins <= 0) return
  const list = getFocus()
  list.push({ at, mins: Math.round(mins) })
  localStorage.setItem(FOCUS_KEY, JSON.stringify(list))
}
