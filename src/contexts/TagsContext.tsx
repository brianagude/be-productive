'use client'

import { createContext, useContext } from 'react'

interface TagsContextValue {
  globalTags: string[]
  tagColors: Record<string, string>
  addTag: (tag: string) => void
  setTagColor: (tag: string, color: string) => void
}

const TagsContext = createContext<TagsContextValue>({
  globalTags: [],
  tagColors: {},
  addTag: () => {},
  setTagColor: () => {},
})

// Bridge provider — useTodos manages the data, page.tsx passes it in here
// so any component in the tree can read tags/colors without prop drilling.
export function TagsProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: TagsContextValue
}) {
  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>
}

export function useTags() {
  return useContext(TagsContext)
}
