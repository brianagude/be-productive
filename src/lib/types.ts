export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type Status = 'todo' | 'in-progress' | 'done' | 'cancelled'

// Platform tags (daily is now a first-class field, not a tag)
export const PLATFORM_TAGS: string[] = []

export const TAG_COLOR_PALETTE = [
  { name: 'red',    hex: '#7f2922' },
  { name: 'orange', hex: '#df9a81' },
  { name: 'yellow', hex: '#dccf73' },
  { name: 'lime',   hex: '#8a9445' },
  { name: 'green',  hex: '#477760' },
  { name: 'teal',   hex: '#7298af' },
  { name: 'blue',   hex: '#295ba4' },
  { name: 'violet', hex: '#c8b2ce' },
  { name: 'pink',   hex: '#e59bc4' },
  { name: 'gray',   hex: '#a9a392' },
] as const

export interface CompletionRecord {
  todoId: string
  title: string
  tags: string[]
  date: string        // "YYYY-MM-DD"
  completedAt: string // ISO timestamp
}

export interface Todo {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  daily: boolean        // resets daily when completed
  weeklyDays: number[]  // days of week (0=Sun…6=Sat) this task recurs on; empty = not weekly
  backlog?: boolean     // parked — hidden from timer and remaining count
  tags: string[]
  deadline?: string     // ISO date string
  createdAt: string
  updatedAt: string
}
