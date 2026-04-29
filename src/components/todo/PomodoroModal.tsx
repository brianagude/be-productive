'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Todo } from '@/lib/types'
import { UsePomodoroReturn } from '@/hooks/usePomodoro'

interface Props {
  pomodoro: UsePomodoroReturn
  todos: Todo[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PomodoroModal({ pomodoro, todos }: Props) {
  const { phase, selectedTodoId, selectedTodoTitle, secondsLeft, totalSeconds, pause, resume, stop, continueWork } = pomodoro
  const selectedTodo = todos.find(t => t.id === selectedTodoId)
  const description = selectedTodo?.description

  if (phase === 'idle') return null

  if (phase === 'prompt') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-2">
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest mb-2">Break complete</span>
        <span className="text-2xl font-medium text-white">Keep going?</span>
        {selectedTodoTitle && (
          <span className="mt-2 text-sm text-white/50 max-w-xs truncate text-center px-4">
            {selectedTodoTitle}
          </span>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={stop}
            className="text-sm px-4 py-1.5 rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Stop
          </button>
          <button
            onClick={continueWork}
            className="text-sm px-5 py-1.5 rounded bg-white text-black hover:bg-white/90 transition-colors font-medium"
          >
            Continue working
          </button>
        </div>
      </div>
    )
  }

  const elapsed = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const phaseLabel = phase === 'break' ? 'BREAK' : 'WORK'

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <span className="text-xs font-medium text-white/30 uppercase tracking-widest mb-6">
        {phaseLabel}
      </span>

      <span className="text-8xl font-mono tabular-nums text-white leading-none">
        {formatTime(secondsLeft)}
      </span>

      {selectedTodoTitle && (
        <span className="mt-6 text-base text-white/50 max-w-sm text-center px-4 leading-snug">
          {selectedTodoTitle}
        </span>
      )}

      {description && (
        <div className="mt-4 max-w-sm w-full px-6 max-h-40 overflow-y-auto text-sm text-white/30 leading-relaxed prose prose-sm prose-invert [&_a]:text-white/50 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-white/10 [&_pre]:p-3 [&_pre]:rounded-md [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  {children}
                </a>
              ),
              input: ({ type, checked }) =>
                type === 'checkbox' ? (
                  <input type="checkbox" checked={checked} readOnly className="mr-1.5" />
                ) : null,
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-24 left-8 right-8">
        <div className="relative h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white/40 transition-[width] duration-500 ease-linear"
            style={{ width: `${elapsed * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-3">
        {phase === 'break' ? null : phase === 'paused' ? (
          <button
            onClick={resume}
            className="text-sm px-4 py-1.5 rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={pause}
            className="text-sm px-4 py-1.5 rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={stop}
          className="text-sm px-4 py-1.5 rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  )
}
