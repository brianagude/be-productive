'use client'

import { useState } from 'react'
import { usePomodoro } from '@/hooks/usePomodoro'
import { DeckControlProvider } from './deckControl'
import { SideBar } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { TimerDrawer } from './TimerDrawer'

export function Wrapper({ children }: { children: React.ReactNode }) {
  const pomodoro = usePomodoro()
  const [timerOpen, setTimerOpen] = useState(false)

  return (
    <DeckControlProvider>
      <main className="relative flex min-h-svh w-full flex-col lg:h-svh lg:overflow-hidden">
        <div className="isolate flex min-h-0 w-full flex-1 flex-col items-center justify-center p-4 sm:p-6 md:px-32 lg:pb-16">
          {children}
        </div>
        <SideBar onOpenTimer={() => setTimerOpen(true)} />
        <SiteFooter />
        <TimerDrawer open={timerOpen} onOpenChange={setTimerOpen} pomodoro={pomodoro} />
      </main>
    </DeckControlProvider>
  )
}
