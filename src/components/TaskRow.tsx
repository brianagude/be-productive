'use client'

import { Task } from '@/lib/types'
import Image from "next/image"

interface TaskRowProps {
  task: Task
  onText: (text: string) => void
  onToggleDone: () => void
  onToggleImportant: () => void
  classes?: string
}

export function TaskRow({ task, onText, onToggleDone, onToggleImportant, classes }: TaskRowProps) {
  const empty = task.text.trim() === ''

  return (
    <div className={`${classes ?? ''} w-full grid grid-cols-[40px_1fr_40px] min-h-10 items-center`}>
      <button
        type="button"
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
        aria-pressed={task.done}
        onClick={onToggleDone}
        disabled={empty}
        className={`flex h-full w-full outline-0 shrink-0 items-center justify-center cursor-pointer disabled:cursor-default ${task.done ? 'opacity-25' : ''}`}
      >
        {task.done ? <Image src="/check-thin.svg" width={14} height={10} alt='' className="mx-auto" /> : ''}
      </button>

      <input
        value={task.text}
        onChange={e => onText(e.target.value)}
        className={`flex-1 bg-transparent text-base outline-none w-full h-full px-2 py-2.5 border-x border-ink-0 placeholder:text-ink-75 disabled:cursor-default ${task.done ? 'text-ink-80 line-through' : ''}`}
        disabled={task.done}
      />

      <button
        type="button"
        aria-label={task.important ? 'Unmark important' : 'Mark important'}
        aria-pressed={task.important}
        onClick={onToggleImportant}
        disabled={empty}
        className={`flex h-full w-full outline-0 shrink-0 items-center justify-center cursor-pointer disabled:cursor-default ${task.done ? 'opacity-25' : ''}`}
      // className={`shrink-0 text-sm leading-none disabled:opacity-30 ${task.important ? 'text-amber-500' : 'text-ink-75'
      //   }`}
      >
        {task.important ? <Image src="/priority.svg" width={3} height={16} alt='' className="mx-auto" /> : ' '}

      </button>
    </div>
  )
}
