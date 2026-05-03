'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTodos, getTagColors, getCompletions } from '@/lib/storage'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuthContext } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { fetchTodos, fetchCompletions, fetchTagColors } from '@/lib/supabase/db'
import { getAllSessions, Session } from '@/lib/pomodoroStorage'
import { Todo, CompletionRecord } from '@/lib/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

function dateStr(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function weekStart(): string {
  const now = new Date()
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  return mon.toISOString().slice(0, 10)
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]
}

function formatDate(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcStreak(byDay: Record<string, number>): number {
  let streak = 0
  const d = new Date()
  if (!byDay[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1)
  while (byDay[d.toISOString().slice(0, 10)] > 0) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ── Completion heatmap ─────────────────────────────────────────────────────────

function heatColor(count: number): string {
  if (count === 0) return 'rgba(148,163,184,0.25)'
  if (count === 1) return 'rgba(244,114,182,0.30)'
  if (count <= 3) return 'rgba(244,114,182,0.55)'
  if (count <= 6) return 'rgba(244,114,182,0.80)'
  return '#f472b6'
}

function CompletionHeatmap({ completionsByDay }: { completionsByDay: Record<string, number> }) {
  const CELL = 11
  const GAP = 2
  const STEP = CELL + GAP

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the Sunday on or before Jan 1 of the current year
  const start = new Date(today.getFullYear(), 0, 1)
  start.setDate(start.getDate() - start.getDay())
  const yearEnd = new Date(today.getFullYear(), 11, 31)

  // Build flat day array through Dec 31, padded to full weeks
  type Day = { date: string; count: number; future: boolean; isToday: boolean }
  const days: Day[] = []
  const cur = new Date(start)
  while (cur <= yearEnd || days.length % 7 !== 0) {
    const dateKey = cur.toISOString().slice(0, 10)
    const future = cur > today
    days.push({
      date: dateKey,
      count: future ? 0 : (completionsByDay[dateKey] ?? 0),
      future,
      isToday: cur.getTime() === today.getTime(),
    })
    cur.setDate(cur.getDate() + 1)
  }

  // Group into weeks (columns of 7)
  const weeks: Day[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // Month labels: track when month changes across weeks (current year only)
  const currentYear = today.getFullYear()
  const monthMarkers: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const firstCurrent = week.find(d => new Date(d.date + 'T12:00:00').getFullYear() === currentYear)
    if (!firstCurrent) return
    const d = new Date(firstCurrent.date + 'T12:00:00')
    const m = d.getMonth()
    if (m !== lastMonth) {
      monthMarkers.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), col })
      lastMonth = m
    }
  })

  const gridWidth = weeks.length * STEP - GAP
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const LEFT_W = 24 // px reserved for day labels

  return (
    <div className="px-4 pt-2 pb-1 col-span-2 bg-background">
      <div className="overflow-x-auto">
        <div style={{ width: LEFT_W + gridWidth }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: LEFT_W }}>
            {monthMarkers.map(({ label, col }, i) => {
              const next = monthMarkers[i + 1]
              const width = next ? (next.col - col) * STEP : undefined
              return (
                <span
                  key={label + col}
                  className="text-[9px] text-muted-foreground/50 shrink-0"
                  style={{ width: width ?? undefined, minWidth: 0, display: 'block' }}
                >
                  {label}
                </span>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex" style={{ gap: GAP }}>
            {/* Day labels */}
            <div className="flex flex-col shrink-0" style={{ gap: GAP, width: LEFT_W }}>
              {dayLabels.map((l, i) => (
                <div key={i} className="text-[9px] text-muted-foreground/40 flex items-center justify-end pr-1"
                  style={{ height: CELL }}>
                  {l}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col shrink-0" style={{ gap: GAP }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.future ? '' : `${day.date}: ${day.count} completed`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: heatColor(day.count),
                      outline: day.isToday ? '1.5px solid hsl(var(--foreground) / 0.4)' : undefined,
                      outlineOffset: day.isToday ? '1px' : undefined,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[9px] text-muted-foreground/40">Less</span>
            {[0, 1, 3, 6, 8].map(n => (
              <div key={n} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: heatColor(n) }} />
            ))}
            <span className="text-[9px] text-muted-foreground/40">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared constants ───────────────────────────────────────────────────────────

const FALLBACK_COLORS = [
  '#60a5fa', '#f87171', '#4ade80', '#facc15',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f472b6', '#94a3b8',
]

// ── Guest dashboard data ───────────────────────────────────────────────────────

interface DashboardData {
  todayTotal: number
  todayTasks: Array<{ id: string; title: string; seconds: number }>
  todayTags: Array<{ tag: string; seconds: number; color: string }>
  weekTotal: number
  weekTags: Array<{ tag: string; seconds: number; color: string }>
  past14: Array<{ date: string; seconds: number }>
  allTimeTotal: number
  bestDaySeconds: number
  bestDayDate: string
  streak: number
  hasAnyData: boolean
  // Completions
  todayCompletions: CompletionRecord[]
  weekCompletions: CompletionRecord[]
  completionsByDay: Record<string, number>
  completionsByTag: Array<{ tag: string; count: number; color: string }>
  completionStreak: number
  totalCompleted: number
}

function compute(todos: Todo[], tagColors: Record<string, string>, sessions: Session[], completions: CompletionRecord[]): DashboardData {
  const todoMap = new Map<string, Todo>(todos.map(t => [t.id, t]))
  const today = dateStr(0)
  const wStart = weekStart()

  // ── By day map (all time)
  const byDay: Record<string, number> = {}
  for (const s of sessions) {
    byDay[s.date] = (byDay[s.date] ?? 0) + s.seconds
  }

  // ── Today
  const todayTaskMap: Record<string, number> = {}
  const todayTagMap: Record<string, number> = {}
  for (const s of sessions.filter(s => s.date === today)) {
    todayTaskMap[s.todoId] = (todayTaskMap[s.todoId] ?? 0) + s.seconds
    const tags = todoMap.get(s.todoId)?.tags ?? []
    if (tags.length === 0) {
      todayTagMap['untagged'] = (todayTagMap['untagged'] ?? 0) + s.seconds
    } else {
      for (const tag of tags) {
        todayTagMap[tag] = (todayTagMap[tag] ?? 0) + s.seconds
      }
    }
  }
  const todayTasks = Object.entries(todayTaskMap)
    .map(([id, seconds]) => ({ id, title: todoMap.get(id)?.title ?? 'Deleted task', seconds }))
    .sort((a, b) => b.seconds - a.seconds)
  const todayTotal = todayTasks.reduce((s, t) => s + t.seconds, 0)
  const todayTags = Object.entries(todayTagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, seconds], i) => ({
      tag, seconds,
      color: tag === 'untagged' ? '#94a3b8' : (tagColors[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
    }))

  // ── This week by tag
  const weekSessions = sessions.filter(s => s.date >= wStart)
  const weekTotal = weekSessions.reduce((s, x) => s + x.seconds, 0)
  const weekTagMap: Record<string, number> = {}
  for (const s of weekSessions) {
    const tags = todoMap.get(s.todoId)?.tags ?? []
    if (tags.length === 0) {
      weekTagMap['untagged'] = (weekTagMap['untagged'] ?? 0) + s.seconds
    } else {
      for (const tag of tags) {
        weekTagMap[tag] = (weekTagMap[tag] ?? 0) + s.seconds
      }
    }
  }
  const weekTags = Object.entries(weekTagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, seconds], i) => ({
      tag, seconds,
      color: tag === 'untagged' ? '#94a3b8' : (tagColors[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
    }))

  // ── Past 14 days
  const past14 = Array.from({ length: 14 }, (_, i) => {
    const d = dateStr(13 - i)
    return { date: d, seconds: byDay[d] ?? 0 }
  })

  // ── All time
  const allTimeTotal = sessions.reduce((s, x) => s + x.seconds, 0)
  const bestEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  const streak = calcStreak(byDay)

  // ── Completions
  const todayCompletions = completions.filter(c => c.date === today)
  const weekCompletions = completions.filter(c => c.date >= wStart)
  const completionsByDay: Record<string, number> = {}
  for (const c of completions) {
    completionsByDay[c.date] = (completionsByDay[c.date] ?? 0) + 1
  }
  const completionStreak = calcStreak(completionsByDay)
  const weekTagMap2: Record<string, number> = {}
  for (const c of weekCompletions) {
    if (c.tags.length === 0) {
      weekTagMap2['untagged'] = (weekTagMap2['untagged'] ?? 0) + 1
    } else {
      for (const tag of c.tags) {
        weekTagMap2[tag] = (weekTagMap2[tag] ?? 0) + 1
      }
    }
  }
  const completionsByTag = Object.entries(weekTagMap2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count], i) => ({
      tag, count,
      color: tag === 'untagged' ? '#94a3b8' : (tagColors[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
    }))

  return {
    todayTotal, todayTasks, todayTags,
    weekTotal, weekTags,
    past14,
    allTimeTotal,
    bestDaySeconds: bestEntry?.[1] ?? 0,
    bestDayDate: bestEntry?.[0] ?? '',
    streak,
    hasAnyData: sessions.length > 0,
    todayCompletions,
    weekCompletions,
    completionsByDay,
    completionsByTag,
    completionStreak,
    totalCompleted: completions.length,
  }
}

// ── Cloud-only dashboard data ──────────────────────────────────────────────────

interface CloudData {
  recentCompletions: CompletionRecord[]
  allTimeByTag: Array<{ tag: string; count: number; color: string }>
  byDayOfWeek: Array<{ label: string; count: number }>
  byMonth: Array<{ label: string; count: number }>
  byPriority: Array<{ priority: string; count: number }>
  recurringTasks: Array<{ id: string; title: string; scheduledCount: number; completionCount: number; rate: number }>
}

function computeCloud(todos: Todo[], tagColors: Record<string, string>, completions: CompletionRecord[]): CloudData {
  // 1. Recent completions (50 most recent)
  const recentCompletions = [...completions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 50)

  // 2. All-time completions by tag
  const tagCounts: Record<string, number> = {}
  for (const c of completions) {
    if (c.tags.length === 0) {
      tagCounts['untagged'] = (tagCounts['untagged'] ?? 0) + 1
    } else {
      for (const tag of c.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
      }
    }
  }
  const allTimeByTag = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count], i) => ({
      tag, count,
      color: tag === 'untagged' ? '#94a3b8' : (tagColors[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
    }))

  // 3. By day of week
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowCounts = new Array(7).fill(0)
  for (const c of completions) {
    dowCounts[new Date(c.date + 'T12:00:00').getDay()]++
  }
  const byDayOfWeek = DOW_LABELS.map((label, i) => ({ label, count: dowCounts[i] }))

  // 4. By month (last 12 months)
  const now = new Date()
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const yearMonth = d.toISOString().slice(0, 7)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: completions.filter(c => c.date.startsWith(yearMonth)).length,
    }
  })

  // 5. By priority (using current todo data for completed todoIds)
  const todoMap = new Map<string, Todo>(todos.map(t => [t.id, t]))
  const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low', 'none']
  const priorityCounts: Record<string, number> = {}
  for (const c of completions) {
    const priority = todoMap.get(c.todoId)?.priority ?? 'none'
    priorityCounts[priority] = (priorityCounts[priority] ?? 0) + 1
  }
  const byPriority = PRIORITY_ORDER
    .filter(p => priorityCounts[p])
    .map(p => ({ priority: p, count: priorityCounts[p] }))

  // 6. Recurring task completion rate (top 10 by completion count)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const completionsByTodoId: Record<string, number> = {}
  for (const c of completions) {
    completionsByTodoId[c.todoId] = (completionsByTodoId[c.todoId] ?? 0) + 1
  }
  const recurringTasks = todos
    .filter(t => t.daily || t.weeklyDays?.length > 0)
    .map(t => {
      const created = new Date(t.createdAt)
      created.setHours(0, 0, 0, 0)
      const daysDiff = Math.max(1, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1)
      let scheduledCount: number
      if (t.daily) {
        scheduledCount = daysDiff
      } else {
        scheduledCount = 0
        for (let d = 0; d < daysDiff; d++) {
          const day = new Date(created)
          day.setDate(created.getDate() + d)
          if (t.weeklyDays.includes(day.getDay())) scheduledCount++
        }
      }
      const completionCount = completionsByTodoId[t.id] ?? 0
      return {
        id: t.id,
        title: t.title,
        scheduledCount,
        completionCount,
        rate: scheduledCount > 0 ? Math.round((completionCount / scheduledCount) * 100) : 0,
      }
    })
    .sort((a, b) => b.completionCount - a.completionCount)
    .slice(0, 10)

  return { recentCompletions, allTimeByTag, byDayOfWeek, byMonth, byPriority, recurringTasks }
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest shrink-0">{label}</span>
      <div className="h-px flex-1 bg-border/60" />
      {right && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{right}</span>}
    </div>
  )
}

// ── Simple bar row (reused across cloud panels) ────────────────────────────────

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      <span className="text-sm text-muted-foreground flex-1 truncate">{label}</span>
      <span className="text-sm font-medium tabular-nums">{count}</span>
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden max-w-24">
        <div
          className="h-full rounded-full bg-foreground/40"
          style={{ width: max > 0 ? `${(count / max) * 100}%` : '0%', backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)

  const handleAccountClick = useCallback(() => {
    if (user) router.push('/account')
    else setAuthOpen(true)
  }, [user, router])
  const [data, setData] = useState<DashboardData | null>(null)
  const [cloudData, setCloudData] = useState<CloudData | null>(null)

  // Guest data — localStorage, refreshes on tab focus
  const loadData = useCallback(() => {
    const sessions = getAllSessions()
    const todos = getTodos()
    const tagColors = getTagColors()
    const completions = getCompletions()
    setData(compute(todos, tagColors, sessions, completions))
  }, [])

  useEffect(() => {
    loadData()
    const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadData])

  // Cloud data — DB, loads when user signs in/out
  useEffect(() => {
    if (!user) {
      setCloudData(null)
      return
    }
    const supabase = createClient()
    ;(async () => {
      try {
        const [todos, completions, tagColors] = await Promise.all([
          fetchTodos(supabase, user.id),
          fetchCompletions(supabase, user.id),
          fetchTagColors(supabase, user.id),
        ])
        setCloudData(computeCloud(todos, tagColors, completions))
      } catch (err) {
        console.error('Failed to load cloud stats:', err)
      }
    })()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <SiteHeader
        title="Stats"
        user={user}
        onAccountClick={handleAccountClick}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="pb-10">
          {/* ── Completion heatmap ────────────────────────────────────────── */}
          <SectionHeader label="Tasks completed" />
          <div className="grid grid-cols-2 gap-px bg-border mx-4 rounded-lg overflow-hidden sm:grid-cols-4">
            <CompletionHeatmap completionsByDay={data.completionsByDay} />
            <div className="bg-background px-4 py-4">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Today</p>
              <p className="text-xl font-semibold tabular-nums">{data.todayCompletions.length}</p>
            </div>
            <div className="bg-background px-4 py-4">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">This week</p>
              <p className="text-xl font-semibold tabular-nums">{data.weekCompletions.length}</p>
            </div>
          </div>


          {!data.hasAnyData && data.totalCompleted === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-8">
              <p className="text-sm text-muted-foreground">No data yet.</p>
              <p className="text-xs text-muted-foreground/50">
                Complete tasks and log time — your stats will appear here.
              </p>
            </div>
          ) : (
            <>
            {/* ── Time today by category ────────────────────────────────────── */}
            {data.todayTags.length > 0 && (
              <>
                <SectionHeader label="Today by category" right={fmt(data.todayTotal)} />
                <div className="px-4 flex flex-col gap-2">
                  {data.todayTags.map(({ tag, seconds, color }) => (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-muted-foreground flex-1">{tag}</span>
                      <span className="text-sm font-medium tabular-nums">{fmt(seconds)}</span>
                      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden max-w-24">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${(seconds / data.todayTotal) * 100}%`,
                            backgroundColor: color,
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Time this week by category ────────────────────────────────── */}
            {data.weekTotal > 0 && (
              <>
                <SectionHeader label="This week by category" right={fmt(data.weekTotal)} />
                <div className="px-4 flex flex-col gap-2">
                  {data.weekTags.map(({ tag, seconds, color }) => (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-muted-foreground flex-1">{tag}</span>
                      <span className="text-sm font-medium tabular-nums">{fmt(seconds)}</span>
                      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden max-w-24">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${(seconds / data.weekTotal) * 100}%`,
                            backgroundColor: color,
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            </>
          )}

          {/* ── Cloud-only sections ───────────────────────────────────────── */}
          {cloudData && (
            <>
              {/* All-time completions by tag */}
              {cloudData.allTimeByTag.length > 0 && (
                <>
                  <SectionHeader label="All-time by category" right={`${cloudData.allTimeByTag.reduce((s, t) => s + t.count, 0)} total`} />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.allTimeByTag.map(({ tag, count, color }) => (
                      <BarRow key={tag} label={tag} count={count} max={cloudData.allTimeByTag[0].count} color={color} />
                    ))}
                  </div>
                </>
              )}

              {/* Day of week breakdown */}
              {cloudData.byDayOfWeek.some(d => d.count > 0) && (
                <>
                  <SectionHeader label="By day of week" />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.byDayOfWeek.map(({ label, count }) => {
                      const max = Math.max(...cloudData.byDayOfWeek.map(d => d.count))
                      return <BarRow key={label} label={label} count={count} max={max} />
                    })}
                  </div>
                </>
              )}

              {/* Monthly trend */}
              {cloudData.byMonth.some(m => m.count > 0) && (
                <>
                  <SectionHeader label="Monthly trend" />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.byMonth.map(({ label, count }) => {
                      const max = Math.max(...cloudData.byMonth.map(m => m.count))
                      return <BarRow key={label} label={label} count={count} max={max} />
                    })}
                  </div>
                </>
              )}

              {/* Priority breakdown */}
              {cloudData.byPriority.length > 0 && (
                <>
                  <SectionHeader label="By priority" />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.byPriority.map(({ priority, count }) => {
                      const max = cloudData.byPriority[0].count
                      return <BarRow key={priority} label={priority} count={count} max={max} />
                    })}
                  </div>
                </>
              )}

              {/* Recurring task rate */}
              {cloudData.recurringTasks.length > 0 && (
                <>
                  <SectionHeader label="Recurring task rate" />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.recurringTasks.map(({ id, title, completionCount, scheduledCount, rate }) => (
                      <div key={id} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground flex-1 truncate">{title}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{completionCount}/{scheduledCount}</span>
                        <span
                          className="text-sm font-medium tabular-nums shrink-0 w-10 text-right"
                          style={{ color: rate >= 70 ? '#4ade80' : rate >= 40 ? '#facc15' : '#f87171' }}
                        >
                          {rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Completion log */}
              {cloudData.recentCompletions.length > 0 && (
                <>
                  <SectionHeader label="Recent completions" right={`${cloudData.recentCompletions.length} shown`} />
                  <div className="px-4 flex flex-col gap-2">
                    {cloudData.recentCompletions.map((c, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs text-muted-foreground/50 tabular-nums shrink-0 pt-0.5 w-16">
                          {formatDate(c.date)}
                        </span>
                        <span className="text-sm text-muted-foreground flex-1">{c.title}</span>
                        {c.tags.length > 0 && (
                          <span className="text-xs text-muted-foreground/50 shrink-0">{c.tags.join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <SiteFooter user={user} onAccountClick={handleAccountClick} />

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
      />
    </div>
  )
}
