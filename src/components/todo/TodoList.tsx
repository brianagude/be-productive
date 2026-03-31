'use client'

import { Todo } from '@/lib/types'
import { TodoItem } from './TodoItem'

function getDeadlineMs(t: Todo): number {
  return t.deadline ? new Date(t.deadline + 'T00:00:00').getTime() : Infinity
}

function byDeadlineThenAlpha(a: Todo, b: Todo): number {
  const aDl = getDeadlineMs(a)
  const bDl = getDeadlineMs(b)
  if (aDl !== bDl) return aDl - bDl
  return a.title.localeCompare(b.title)
}

function daysUntilNext(days: number[], todayDow: number): number {
  if (days.length === 0) return 7
  return Math.min(...days.map(d => (d - todayDow + 7) % 7))
}

function byWeeklyDay(a: Todo, b: Todo): number {
  const todayDow = new Date().getDay()
  const aNext = daysUntilNext(a.weeklyDays ?? [], todayDow)
  const bNext = daysUntilNext(b.weeklyDays ?? [], todayDow)
  if (aNext !== bNext) return aNext - bNext
  return a.title.localeCompare(b.title)
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-xs text-muted-foreground/50">{count}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}

interface TodoListProps {
  todos: Todo[]
  onStatusClick: (todo: Todo) => void
  onTodoClick: (todo: Todo) => void
}

export function TodoList({ todos, onStatusClick, onTodoClick }: TodoListProps) {
  const active = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const done   = todos.filter(t => t.status === 'done' || t.status === 'cancelled')

  const daily   = active.filter(t => t.daily).sort(byDeadlineThenAlpha)
  const weekly  = active.filter(t => !t.daily && t.weeklyDays && t.weeklyDays.length > 0).sort(byWeeklyDay)
  const rest    = active.filter(t => !t.daily && (!t.weeklyDays || t.weeklyDays.length === 0)).sort(byDeadlineThenAlpha)
  const completed = done.sort(byDeadlineThenAlpha)

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        No tasks yet.
      </div>
    )
  }

  const renderGroup = (items: Todo[]) => items.map(todo => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onStatusClick={() => onStatusClick(todo)}
      onClick={() => onTodoClick(todo)}
    />
  ))

  const hasHeaders = daily.length > 0 || weekly.length > 0

  return (
    <div className="pb-2">
      {daily.length > 0 && (
        <section>
          <SectionHeader label="Daily" count={daily.length} />
          {renderGroup(daily)}
        </section>
      )}

      {weekly.length > 0 && (
        <section>
          <SectionHeader label="Weekly" count={weekly.length} />
          {renderGroup(weekly)}
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {hasHeaders && <SectionHeader label="Tasks" count={rest.length} />}
          {renderGroup(rest)}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <SectionHeader label="Completed" count={completed.length} />
          {renderGroup(completed)}
        </section>
      )}
    </div>
  )
}
