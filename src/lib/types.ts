export type CardKind = 'today' | 'daily' | 'weekly'

export const CARD_KINDS: CardKind[] = ['today', 'daily', 'weekly']

/** Fixed number of task slots per card. */
export const SLOTS = 12

export interface Task {
  text: string
  done: boolean
  important: boolean
}

export interface CardState {
  title: string
  description: string
  tasks: Task[] // always length SLOTS
}

export type CardsState = Record<CardKind, CardState>
