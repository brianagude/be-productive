'use client'

import { useState } from 'react'
import { Todo } from '@/lib/types'
import { TodoItem } from './TodoItem'
import { cn } from '@/lib/utils'

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

function getTodoSection(todo: Todo): string {
  if (todo.backlog) return 'backlog'
  if (todo.daily) return 'daily'
  if (todo.weeklyDays?.length) return 'weekly'
  return 'tasks'
}

function getDropChanges(sectionKey: string, todo: Todo): Partial<Todo> {
  const todayDow = new Date().getDay()
  switch (sectionKey) {
    case 'daily':   return { daily: true, weeklyDays: [], backlog: false }
    case 'weekly':  return { daily: false, weeklyDays: todo.weeklyDays?.length ? todo.weeklyDays : [todayDow], backlog: false }
    case 'tasks':   return { daily: false, weeklyDays: [], backlog: false }
    case 'backlog': return { backlog: true, daily: false, weeklyDays: [] }
  }
  return {}
}

function SectionHeader({ label, count, collapsed, onToggle, dragOver }: {
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
  dragOver: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-4 pt-4 pb-1 rounded-md transition-colors',
        dragOver && collapsed && 'bg-accent/60'
      )}
    >
      <svg
        className={cn('w-2.5 h-2.5 text-muted-foreground/40 shrink-0 transition-transform', collapsed && '-rotate-90')}
        fill="currentColor" viewBox="0 0 10 6"
      >
        <path d="M0 0l5 6 5-6z" />
      </svg>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-xs text-muted-foreground/50">{count}</span>
      <div className="h-px flex-1 bg-border/60" />
    </button>
  )
}

interface TodoListProps {
  todos: Todo[]
  onStatusClick: (todo: Todo) => void
  onTodoClick: (todo: Todo) => void
  onUpdate: (id: string, changes: Partial<Todo>) => void
  onNewTask: () => void
}

export function TodoList({ todos, onStatusClick, onTodoClick, onUpdate, onNewTask }: TodoListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ backlog: true })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)

  const toggle = (key: string) => {
    const next = !collapsed[key]
    setCollapsed(prev => ({ ...prev, [key]: next }))
  }

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggingId(todoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', todoId)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverSection(null)
  }

  const handleDragOver = (e: React.DragEvent, sectionKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSection(sectionKey)
  }

  const handleDrop = (e: React.DragEvent, sectionKey: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const todo = todos.find(t => t.id === id)
    if (!todo || getTodoSection(todo) === sectionKey) {
      setDraggingId(null)
      setDragOverSection(null)
      return
    }
    onUpdate(id, getDropChanges(sectionKey, todo))
    setDraggingId(null)
    setDragOverSection(null)
  }

  const active    = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled' && !t.backlog)
  const backlogItems = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled' && t.backlog).sort((a, b) => a.title.localeCompare(b.title))
  const done      = todos.filter(t => t.status === 'done' || t.status === 'cancelled')

  const daily   = active.filter(t => t.daily).sort(byDeadlineThenAlpha)
  const weekly  = active.filter(t => !t.daily && t.weeklyDays && t.weeklyDays.length > 0).sort(byWeeklyDay)
  const rest    = active.filter(t => !t.daily && (!t.weeklyDays || t.weeklyDays.length === 0)).sort(byDeadlineThenAlpha)
  const completed = done.sort(byDeadlineThenAlpha)

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground text-sm">
        <span>No tasks yet.</span>
        <button
          onClick={onNewTask}
          className="cursor-pointer text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create a New task
        </button>
      </div>
    )
  }

  const renderItems = (items: Todo[]) => items.map(todo => (
    <div
      key={todo.id}
      draggable
      onDragStart={e => handleDragStart(e, todo.id)}
      onDragEnd={handleDragEnd}
      className={cn('transition-opacity', draggingId === todo.id && 'opacity-30')}
    >
      <TodoItem
        todo={todo}
        onStatusClick={() => onStatusClick(todo)}
        onClick={() => onTodoClick(todo)}
      />
    </div>
  ))

  const dropZone = (sectionKey: string, children: React.ReactNode) => (
    <div
      onDragOver={e => handleDragOver(e, sectionKey)}
      onDragLeave={e => {
        // only clear if leaving the section entirely (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSection(null)
      }}
      onDrop={e => handleDrop(e, sectionKey)}
      className={cn(
        'rounded-md transition-colors',
        dragOverSection === sectionKey && !collapsed[sectionKey] && 'bg-accent/30'
      )}
    >
      {children}
    </div>
  )

  const hasHeaders = daily.length > 0 || weekly.length > 0

  return (
    <div className="pb-2">
      {daily.length > 0 && dropZone('daily',
        <section>
          <SectionHeader label="Daily" count={daily.length} collapsed={!!collapsed.daily} onToggle={() => toggle('daily')} dragOver={dragOverSection === 'daily'} />
          {!collapsed.daily && renderItems(daily)}
        </section>
      )}

      {weekly.length > 0 && dropZone('weekly',
        <section>
          <SectionHeader label="Weekly" count={weekly.length} collapsed={!!collapsed.weekly} onToggle={() => toggle('weekly')} dragOver={dragOverSection === 'weekly'} />
          {!collapsed.weekly && renderItems(weekly)}
        </section>
      )}

      {rest.length > 0 && dropZone('tasks',
        <section>
          {hasHeaders
            ? <>
                <SectionHeader label="Tasks" count={rest.length} collapsed={!!collapsed.tasks} onToggle={() => toggle('tasks')} dragOver={dragOverSection === 'tasks'} />
                {!collapsed.tasks && renderItems(rest)}
              </>
            : renderItems(rest)
          }
        </section>
      )}

      {backlogItems.length > 0 && dropZone('backlog',
        <section>
          <SectionHeader label="Backlog" count={backlogItems.length} collapsed={!!collapsed.backlog} onToggle={() => toggle('backlog')} dragOver={dragOverSection === 'backlog'} />
          {!collapsed.backlog && renderItems(backlogItems)}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <SectionHeader label="Completed" count={completed.length} collapsed={!!collapsed.completed} onToggle={() => toggle('completed')} dragOver={false} />
          {!collapsed.completed && renderItems(completed)}
        </section>
      )}
    </div>
  )
}
