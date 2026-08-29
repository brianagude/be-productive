'use client'

import { Drawer } from 'vaul'
import { UsePomodoroReturn } from '@/hooks/usePomodoro'

const btn = 'rounded border border-ink-75 px-3 py-1.5 text-sm hover:bg-ink-95'

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function clampInt(value: string, min: number, max: number, fallback: number): number {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

interface TimerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pomodoro: UsePomodoroReturn
}

export function TimerDrawer({ open, onOpenChange, pomodoro }: TimerDrawerProps) {
  const {
    phase, secondsLeft, settings,
    start, pause, resume, stop, skipBreak, continueWork, updateSettings,
  } = pomodoro

  const idleish = phase === 'idle' || phase === 'prompt'
  const display = idleish ? settings.workMins * 60 : secondsLeft

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink-0/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-ink-90 bg-ink-100 p-6 outline-none">
          <div className="mx-auto max-w-sm">
            <Drawer.Title className="text-lg">Timer</Drawer.Title>
            <Drawer.Description className="sr-only">Pomodoro work and break timer</Drawer.Description>

            <div className="mt-4 text-center">
              <div className="text-5xl tabular-nums">{fmt(display)}</div>
              <div className="mt-1 text-xs capitalize text-ink-45">{phase}</div>
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {phase === 'idle' && <button className={btn} onClick={start}>Start</button>}
              {phase === 'work' && (
                <>
                  <button className={btn} onClick={pause}>Pause</button>
                  <button className={btn} onClick={stop}>Stop</button>
                </>
              )}
              {phase === 'paused' && (
                <>
                  <button className={btn} onClick={resume}>Resume</button>
                  <button className={btn} onClick={stop}>Stop</button>
                </>
              )}
              {phase === 'break' && <button className={btn} onClick={skipBreak}>Skip break</button>}
              {phase === 'prompt' && (
                <>
                  <button className={btn} onClick={continueWork}>Another</button>
                  <button className={btn} onClick={skipBreak}>Done</button>
                </>
              )}
            </div>

            {idleish && (
              <div className="mt-6 flex justify-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  Work
                  <input
                    type="number" min={1} max={90} value={settings.workMins}
                    onChange={e => updateSettings({ ...settings, workMins: clampInt(e.target.value, 1, 90, 25) })}
                    className="w-14 rounded border border-ink-75 px-1 py-0.5"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  Break
                  <input
                    type="number" min={1} max={30} value={settings.breakMins}
                    onChange={e => updateSettings({ ...settings, breakMins: clampInt(e.target.value, 1, 30, 5) })}
                    className="w-14 rounded border border-ink-75 px-1 py-0.5"
                  />
                </label>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
