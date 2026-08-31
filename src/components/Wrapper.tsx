'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { usePomodoro } from '@/hooks/usePomodoro'
import { DeckControlProvider } from './deckControl'
import { SideBar } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { TimerDrawer } from './TimerDrawer'

export function Wrapper({ children }: { children: React.ReactNode }) {
  const pomodoro = usePomodoro()
  const [timerOpen, setTimerOpen] = useState(false)
  // The card-deck home page is a fixed-height, vertically-centred canvas.
  // Every other route keeps the normal scrolling layout.
  const isDeck = usePathname() === '/'

  return (
    <DeckControlProvider>
      <main
        className={`relative flex w-full flex-col ${isDeck ? 'min-h-svh lg:h-svh lg:overflow-hidden' : 'min-h-screen'
          }`}
      >
        <div
          className={`w-full px-4 pb-4 pt-14 sm:px-6 sm:pb-6 md:pt-6 md:px-32 ${isDeck ? 'isolate flex min-h-0 flex-1 flex-col items-center justify-center lg:pb-16' : ''
            }`}
        >
          {children}
        </div>
        <SideBar onOpenTimer={() => setTimerOpen(true)} />
        {/* <SiteFooter /> */}
        <TimerDrawer open={timerOpen} onOpenChange={setTimerOpen} pomodoro={pomodoro} />
      </main>
    </DeckControlProvider>
  )
}
