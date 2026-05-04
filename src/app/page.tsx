'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Todo, Priority } from '@/lib/types'
import { useTodos } from '@/hooks/useTodos'
import { useAuthContext } from '@/contexts/AuthContext'
import { TagsProvider } from '@/contexts/TagsContext'
import { usePomodoro } from '@/hooks/usePomodoro'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { TodoList } from '@/components/todo/TodoList'
import { TodoModal, ModalState } from '@/components/todo/TodoModal'
import { TimerModal } from '@/components/todo/TimerModal'
import { PomodoroModal } from '@/components/todo/PomodoroModal'
import { AuthModal } from '@/components/auth/AuthModal'

export default function TodoPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const { todos, globalTags, tagColors, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag, addTag, setTagColor } = useTodos()
  const [authOpen, setAuthOpen] = useState(false)

  const handleAccountClick = useCallback(() => {
    if (user) router.push('/account')
    else setAuthOpen(true)
  }, [user, router])
  const pomodoro = usePomodoro()
  const [modal, setModal] = useState<ModalState>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#new') {
      history.replaceState(null, '', '/')
      return { mode: 'create' }
    }
    return { mode: 'closed' }
  })
  const [timerOpen, setTimerOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#timer') {
      history.replaceState(null, '', '/')
      return true
    }
    return false
  })

  const handleTodoClick = (todo: Todo) => setModal({ mode: 'edit', todo })

  const handleCycleStatus = (id: string, status: Todo['status']) => {
    cycleStatus(id, status)
    if (modal.mode === 'edit' && modal.todo.id === id) {
      const cycle = ['todo', 'in-progress', 'done', 'cancelled'] as const
      const next = cycle[(cycle.indexOf(status) + 1) % cycle.length]
      setModal({ mode: 'edit', todo: { ...modal.todo, status: next } })
    }
  }

  const handleCreate = (title: string, fields: Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>) => {
    addTodo(title, fields.priority as Priority | undefined, fields.daily ?? false, fields.weeklyDays ?? [], fields.tags ?? [], fields.deadline, fields.description, fields.backlog ?? false)
  }

  const handleUpdate = (id: string, changes: Partial<Todo>) => {
    updateTodo(id, changes)
    if (modal.mode === 'edit' && modal.todo.id === id) {
      setModal({ mode: 'edit', todo: { ...modal.todo, ...changes } })
    }
  }

  const handleRenameTag = (oldName: string, newName: string) => {
    renameTag(oldName, newName)
    if (modal.mode === 'edit' && modal.todo.tags.includes(oldName)) {
      setModal({ mode: 'edit', todo: { ...modal.todo, tags: modal.todo.tags.map(t => t === oldName ? newName : t) } })
    }
  }

  const handleDeleteTag = (tagName: string) => {
    deleteTag(tagName)
    if (modal.mode === 'edit' && modal.todo.tags.includes(tagName)) {
      setModal({ mode: 'edit', todo: { ...modal.todo, tags: modal.todo.tags.filter(t => t !== tagName) } })
    }
  }

  const remaining = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled' && !t.backlog).length

  return (
    <TagsProvider value={{ globalTags, tagColors, addTag, setTagColor }}>
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <SiteHeader
        title="Things I Need To Do"
        remaining={remaining}
        onNewTask={() => setModal({ mode: 'create' })}
        onOpenTimer={() => setTimerOpen(true)}
        user={user}
        onAccountClick={handleAccountClick}
      />

      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/50 bg-border/15">
        <span className="flex-1 text-xs text-muted-foreground/50">Task</span>
        <span className="text-xs text-muted-foreground/50 shrink-0 pr-1">Tags / Deadline</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TodoList
          todos={todos}
          onStatusClick={todo => handleCycleStatus(todo.id, todo.status)}
          onTodoClick={handleTodoClick}
          onUpdate={handleUpdate}
          onNewTask={() => setModal({ mode: 'create' })}
        />
      </div>

      <TimerModal
        open={timerOpen}
        onClose={() => setTimerOpen(false)}
        pomodoro={pomodoro}
        todos={todos.filter(t => t.status !== 'done' && t.status !== 'cancelled' && !t.backlog)}
      />

      <PomodoroModal pomodoro={pomodoro} todos={todos} />

      <SiteFooter user={user} onAccountClick={handleAccountClick} />

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
      />

      <TodoModal
        state={modal}
        onClose={() => setModal({ mode: 'closed' })}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={deleteTodo}
        onCycleStatus={handleCycleStatus}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
      />
    </div>
    </TagsProvider>
  )
}
