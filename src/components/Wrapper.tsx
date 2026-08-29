'use client'

import { useState } from 'react'
import { usePomodoro } from '@/hooks/usePomodoro'
import { SideBar } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { TimerDrawer } from './TimerDrawer'

export function Wrapper({ children }: { children: React.ReactNode }) {
  const pomodoro = usePomodoro()
  const [timerOpen, setTimerOpen] = useState(false)

  return (
    <main className="relative min-h-screen w-full flex flex-col">
      <div className="w-full p-4 sm:p-6 md:px-32">
        {children}
      </div>
      <SideBar onOpenTimer={() => setTimerOpen(true)} />
      <SiteFooter />
      <TimerDrawer open={timerOpen} onOpenChange={setTimerOpen} pomodoro={pomodoro} />
    </main>
  )
}
