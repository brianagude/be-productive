/** Fixed number of task slots per card. */
export const SLOTS = 12

export interface Task {
  text: string
  done: boolean
  important: boolean
}

export interface CardState {
  id: string
  title: string
  description: string
  date: string // YYYY-MM-DD, editable; defaults to the day the card was made
  smiley: string // one of SMILEYS, picked at random on creation
  tasks: Task[] // always length SLOTS
}

export type CardsState = CardState[]

/** Smiley art living in /public as `smiley-<name>.svg`. */
export const SMILEYS = [
  'angry',
  'cool',
  'crying-1',
  'cute',
  'drool',
  'emoji-kiss-nervous',
  'emoji-terrified',
  'grumpy',
  'happy-face',
  'happy',
  'in-love',
  'kiss',
  'laughing-3',
  'mask',
  'nauseas',
  'smirk',
  'sparks',
  'surprised',
  'throw-up',
  'very-shocked',
] as const
