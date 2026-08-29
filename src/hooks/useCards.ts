'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CardKind, CardsState, CardState, Task } from '@/lib/types'
import {
  getCards, saveCards, getResets, saveResets, applyResets, blankCards,
} from '@/lib/cardsStorage'
import { pushCompletion, popCompletionForToday } from '@/lib/completionsStorage'

export function useCards() {
  const [cards, setCards] = useState<CardsState>(blankCards)
  const cardsRef = useRef<CardsState>(cards)

  const persist = useCallback((next: CardsState) => {
    cardsRef.current = next
    setCards(next)
    saveCards(next)
  }, [])

  // Load from storage + apply any missed resets, on mount and on tab refocus.
  useEffect(() => {
    const load = () => {
      const { cards: fixed, resets, changed } = applyResets(getCards(), getResets())
      if (changed) {
        saveCards(fixed)
        saveResets(resets)
      }
      cardsRef.current = fixed
      setCards(fixed)
    }
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const mutateTask = useCallback(
    (kind: CardKind, index: number, fn: (t: Task) => Task) => {
      const cur = cardsRef.current
      const card = cur[kind]
      const tasks = card.tasks.map((t, i) => (i === index ? fn(t) : t))
      persist({ ...cur, [kind]: { ...card, tasks } })
    },
    [persist],
  )

  const setTaskText = useCallback(
    (kind: CardKind, index: number, text: string) => {
      mutateTask(kind, index, t => ({ ...t, text }))
    },
    [mutateTask],
  )

  const toggleImportant = useCallback(
    (kind: CardKind, index: number) => {
      mutateTask(kind, index, t => ({ ...t, important: !t.important }))
    },
    [mutateTask],
  )

  /** Toggle done. Records/undoes a completion. Returns the new done state (for the undo toast). */
  const toggleDone = useCallback(
    (kind: CardKind, index: number): boolean => {
      const task = cardsRef.current[kind].tasks[index]
      if (task.text.trim() === '') return task.done // ignore empty slots
      const nextDone = !task.done
      if (nextDone) pushCompletion()
      else popCompletionForToday()
      mutateTask(kind, index, t => ({ ...t, done: nextDone }))
      return nextDone
    },
    [mutateTask],
  )

  const setCardMeta = useCallback(
    (kind: CardKind, patch: Partial<Pick<CardState, 'title' | 'description'>>) => {
      const cur = cardsRef.current
      persist({ ...cur, [kind]: { ...cur[kind], ...patch } })
    },
    [persist],
  )

  /** One-shot bulk import used by the migration drawer: fill empty slots with texts. */
  const importTexts = useCallback(
    (kind: CardKind, texts: string[]) => {
      const cur = cardsRef.current
      const card = cur[kind]
      const tasks = card.tasks.map((t, i) =>
        texts[i] ? { text: texts[i], done: false, important: false } : t,
      )
      persist({ ...cur, [kind]: { ...card, tasks } })
    },
    [persist],
  )

  return { cards, setTaskText, toggleDone, toggleImportant, setCardMeta, importTexts }
}
