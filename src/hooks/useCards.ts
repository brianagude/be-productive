'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CardState, Task } from '@/lib/types'
import { getCards, saveCards, newCard } from '@/lib/cardsStorage'
import { pushCompletion, popCompletionForToday } from '@/lib/completionsStorage'

export function useCards() {
  const [cards, setCards] = useState<CardState[]>([])
  const ref = useRef<CardState[]>(cards)

  const persist = useCallback((next: CardState[]) => {
    ref.current = next
    setCards(next)
    saveCards(next)
  }, [])

  // Load from storage on mount and on tab refocus (client-only).
  useEffect(() => {
    const loaded = getCards()
    ref.current = loaded
    setCards(loaded)
    saveCards(loaded)

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const fresh = getCards()
      ref.current = fresh
      setCards(fresh)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

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

  /** Toggle done. Records/undoes a completion. Returns the new done state. */
  const toggleDone = useCallback(
    (id: string, index: number): boolean => {
      const task = ref.current.find(c => c.id === id)?.tasks[index]
      if (!task || task.text.trim() === '') return !!task?.done
      const nextDone = !task.done
      if (nextDone) pushCompletion()
      else popCompletionForToday()
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

  /** New card, appended to the end of the list. */
  const addCard = useCallback(() => {
    persist([...ref.current, newCard()])
  }, [persist])

  /** One-shot import: append a new card seeded with the given task texts. */
  const importTasks = useCallback(
    (texts: string[]) => {
      if (!texts.length) return
      const card = newCard()
      card.tasks = card.tasks.map((t, i) => (texts[i] ? { ...t, text: texts[i] } : t))
      card.title = 'IMPORTED'
      persist([...ref.current, card])
    },
    [persist],
  )

  /** Remove a card from the list. */
  const deleteCard = useCallback(
    (id: string) => {
      persist(ref.current.filter(c => c.id !== id))
    },
    [persist],
  )

  return {
    cards,
    setTaskText,
    toggleDone,
    toggleImportant,
    setCardMeta,
    addCard,
    deleteCard,
    importTasks,
  }
}
