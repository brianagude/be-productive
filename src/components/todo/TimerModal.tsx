'use client'

import { Todo } from '@/lib/types'
import { UsePomodoroReturn } from '@/hooks/usePomodoro'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface TimerModalProps {
  open: boolean
  onClose: () => void
  pomodoro: UsePomodoroReturn
  todos: Todo[]
}

const inputCls = 'w-16 text-xs rounded-md border border-border bg-background px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-ring tabular-nums'

export function TimerModal({ open, onClose, pomodoro, todos }: TimerModalProps) {
  const { selectedTodoId, settings, start, selectTodo, updateSettings } = pomodoro

  const activeTodos = todos
    .filter(t => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => a.title.localeCompare(b.title))

  const handleStart = () => {
    start()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-xs p-5 gap-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Timer</p>

        <select
          value={selectedTodoId ?? ''}
          onChange={e => {
            const todo = activeTodos.find(t => t.id === e.target.value)
            if (todo) selectTodo(todo.id, todo.title)
          }}
          className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select a task…</option>
          {activeTodos.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Work</span>
            <input
              type="number" min={1} max={120}
              value={settings.workMins}
              onChange={e => updateSettings({ ...settings, workMins: Math.max(1, parseInt(e.target.value) || 1) })}
              className={inputCls}
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Break</span>
            <input
              type="number" min={1} max={60}
              value={settings.breakMins}
              onChange={e => updateSettings({ ...settings, breakMins: Math.max(1, parseInt(e.target.value) || 1) })}
              className={inputCls}
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!selectedTodoId}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
