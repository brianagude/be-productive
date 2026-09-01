'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CardState, Task } from '@/lib/types'
import {
  getCards,
  saveCards,
  newCard,
  getActiveId,
  saveActiveId,
  sortCards,
} from '@/lib/cardsStorage'
import { pushCompletion } from '@/lib/completionsStorage'

/** Pick a sensible active id: the stored one if it still exists, else the last card. */
function resolveActiveId(list: CardState[], preferred: string | null): string | null {
  if (!list.length) return null
  if (preferred && list.some(c => c.id === preferred)) return preferred
  return list[list.length - 1].id
}

export function useCards() {
  const [cards, setCards] = useState<CardState[]>([])
  const [activeId, setActiveIdState] = useState<string | null>(null)
  const ref = useRef<CardState[]>(cards)
  const activeRef = useRef<string | null>(null)

  const persistActive = useCallback((id: string | null) => {
    activeRef.current = id
    setActiveIdState(id)
    saveActiveId(id)
  }, [])

  const persist = useCallback(
    (next: CardState[]) => {
      const sorted = sortCards(next)
      ref.current = sorted
      setCards(sorted)
      saveCards(sorted)
      // keep the active pointer valid as cards come and go
      const resolved = resolveActiveId(sorted, activeRef.current)
      if (resolved !== activeRef.current) persistActive(resolved)
    },
    [persistActive],
  )

  /** Move the deck's "current" card. No-op if it isn't a real card. */
  const setActiveId = useCallback(
    (id: string | null) => {
      if (id === activeRef.current) return
      if (id && !ref.current.some(c => c.id === id)) return
      persistActive(id)
    },
    [persistActive],
  )

  // Load from storage on mount and on tab refocus (client-only).
  useEffect(() => {
    const loaded = getCards()
    ref.current = loaded
    setCards(loaded)
    saveCards(loaded)

    const resolved = resolveActiveId(loaded, getActiveId())
    activeRef.current = resolved
    setActiveIdState(resolved)
    saveActiveId(resolved)

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const fresh = getCards()
      ref.current = fresh
      setCards(fresh)
      const next = resolveActiveId(fresh, activeRef.current)
      if (next !== activeRef.current) persistActive(next)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [persistActive])

  const patchCard = useCallback(
    (id: string, fn: (c: CardState) => CardState) => {
      persist(ref.current.map(c => (c.id === id ? fn(c) : c)))
    },
    [persist],
  )

  const mutateTask = useCallback(
    (id: string, index: number, fn: (t: Task) => Task) => {
      patchCard(id, c => ({
        ...c,
        tasks: c.tasks.map((t, i) => (i === index ? fn(t) : t)),
      }))
    },
    [patchCard],
  )

  const setTaskText = useCallback(
    (id: string, index: number, text: string) => mutateTask(id, index, t => ({ ...t, text })),
    [mutateTask],
  )

  const toggleImportant = useCallback(
    (id: string, index: number) =>
      mutateTask(id, index, t => ({ ...t, important: !t.important })),
    [mutateTask],
  )

  /** Toggle done. Each check-on tallies a completion; unchecking never removes one. Returns the new done state. */
  const toggleDone = useCallback(
    (id: string, index: number): boolean => {
      const task = ref.current.find(c => c.id === id)?.tasks[index]
      if (!task || task.text.trim() === '') return !!task?.done
      const nextDone = !task.done
      if (nextDone) pushCompletion()
      mutateTask(id, index, t => ({ ...t, done: nextDone }))
      return nextDone
    },
    [mutateTask],
  )

  const setCardMeta = useCallback(
    (id: string, patch: Partial<Pick<CardState, 'title' | 'description' | 'date'>>) => {
      patchCard(id, c => ({ ...c, ...patch }))
    },
    [patchCard],
  )

  /** New card, appended to the end of the list. Becomes the active card. */
  const addCard = useCallback((): string => {
    const card = newCard()
    persist([...ref.current, card])
    persistActive(card.id)
    return card.id
  }, [persist, persistActive])

  /** Remove a card from the list. */
  const deleteCard = useCallback(
    (id: string) => {
      persist(ref.current.filter(c => c.id !== id))
    },
    [persist],
  )

  return {
    cards,
    activeId,
    setActiveId,
    setTaskText,
    toggleDone,
    toggleImportant,
    setCardMeta,
    addCard,
    deleteCard,
  }
}
