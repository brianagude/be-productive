'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface DeckControl {
  /** true = the deck is fanned open */
  spread: boolean
  /** true = a deck that can be fanned is mounted (fan mode) */
  available: boolean
  toggle: () => void
  /** CardDeck internal: register the toggle impl (or null to hide the control) */
  bind: (impl: (() => void) | null) => void
  /** CardDeck internal: report the current spread state */
  report: (spread: boolean) => void
}

const Ctx = createContext<DeckControl | null>(null)

export function DeckControlProvider({ children }: { children: React.ReactNode }) {
  const [spread, setSpread] = useState(false)
  const [available, setAvailable] = useState(false)
  const impl = useRef<(() => void) | null>(null)

  const toggle = useCallback(() => impl.current?.(), [])
  const bind = useCallback((fn: (() => void) | null) => {
    impl.current = fn
    setAvailable(!!fn)
  }, [])
  const report = useCallback((s: boolean) => setSpread(s), [])

  return (
    <Ctx.Provider value={{ spread, available, toggle, bind, report }}>{children}</Ctx.Provider>
  )
}

export function useDeckControl() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDeckControl must be used within DeckControlProvider')
  return ctx
}
