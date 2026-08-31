'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

interface DeckActions {
  toggle: () => void
  add: () => void
  remove: () => void
}

interface DeckReport {
  spread?: boolean
  count?: number
  mounted?: boolean
  fanCapable?: boolean
}

interface DeckControl {
  /** true = the deck is showing the fanned-out spread */
  spread: boolean
  /** true = a CardDeck is mounted (the home list view) */
  available: boolean
  /** New allowed: whenever the deck is mounted */
  canAdd: boolean
  /** Delete allowed: deck mounted with more than one card */
  canRemove: boolean
  /** Fan toggle allowed: wide viewport + real pointer */
  canToggle: boolean
  toggle: () => void
  add: () => void
  remove: () => void
  // CardDeck internals:
  bind: (actions: DeckActions | null) => void
  report: (patch: DeckReport) => void
}

const Ctx = createContext<DeckControl | null>(null)

export function DeckControlProvider({ children }: { children: React.ReactNode }) {
  const [spread, setSpread] = useState(false)
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [fanCapable, setFanCapable] = useState(false)
  const actions = useRef<DeckActions | null>(null)

  const bind = useCallback((a: DeckActions | null) => {
    actions.current = a
  }, [])
  const report = useCallback((patch: DeckReport) => {
    if (patch.spread !== undefined) setSpread(patch.spread)
    if (patch.count !== undefined) setCount(patch.count)
    if (patch.mounted !== undefined) setMounted(patch.mounted)
    if (patch.fanCapable !== undefined) setFanCapable(patch.fanCapable)
  }, [])

  const toggle = useCallback(() => actions.current?.toggle(), [])
  const add = useCallback(() => actions.current?.add(), [])
  const remove = useCallback(() => actions.current?.remove(), [])

  const value = useMemo<DeckControl>(
    () => ({
      spread,
      available: mounted,
      canAdd: mounted,
      canRemove: mounted && count > 1,
      canToggle: mounted && fanCapable,
      toggle,
      add,
      remove,
      bind,
      report,
    }),
    [spread, mounted, fanCapable, count, toggle, add, remove, bind, report],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDeckControl() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDeckControl must be used within DeckControlProvider')
  return ctx
}
