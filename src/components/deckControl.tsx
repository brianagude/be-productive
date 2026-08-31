'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

interface DeckActions {
  toggle: () => void
  add: () => void
  remove: () => void
}

interface DeckControl {
  /** true = the deck is fanned open */
  spread: boolean
  /** true = a fan-mode deck is mounted (list page, desktop + mouse) */
  available: boolean
  /** New allowed: on the stacked list view */
  canAdd: boolean
  /** Delete allowed: stacked list view with more than one card */
  canRemove: boolean
  toggle: () => void
  add: () => void
  remove: () => void
  // CardDeck internals:
  bind: (actions: DeckActions | null) => void
  report: (patch: { spread?: boolean; count?: number }) => void
}

const Ctx = createContext<DeckControl | null>(null)

export function DeckControlProvider({ children }: { children: React.ReactNode }) {
  const [spread, setSpread] = useState(false)
  const [count, setCount] = useState(0)
  const [available, setAvailable] = useState(false)
  const actions = useRef<DeckActions | null>(null)

  const bind = useCallback((a: DeckActions | null) => {
    actions.current = a
    setAvailable(!!a)
  }, [])
  const report = useCallback((patch: { spread?: boolean; count?: number }) => {
    if (patch.spread !== undefined) setSpread(patch.spread)
    if (patch.count !== undefined) setCount(patch.count)
  }, [])

  const toggle = useCallback(() => actions.current?.toggle(), [])
  const add = useCallback(() => actions.current?.add(), [])
  const remove = useCallback(() => actions.current?.remove(), [])

  const value = useMemo<DeckControl>(
    () => ({
      spread,
      available,
      canAdd: available && !spread,
      canRemove: available && !spread && count > 0,
      toggle,
      add,
      remove,
      bind,
      report,
    }),
    [spread, available, count, toggle, add, remove, bind, report],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDeckControl() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDeckControl must be used within DeckControlProvider')
  return ctx
}
