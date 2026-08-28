import { Todo, CompletionRecord } from './types'
import { createClient } from '@/lib/supabase/client'
import {
  fetchTodos, fetchCompletions, fetchGlobalTags, fetchTagColors,
} from '@/lib/supabase/db'
import {
  saveTodos, saveCompletions, saveGlobalTags, saveTagColors,
} from '@/lib/storage'

export interface CloudExport {
  exportedAt: string
  todos: Todo[]
  completions: CompletionRecord[]
  globalTags: string[]
  tagColors: Record<string, string>
}

/**
 * One-time wind-down helper: pull everything this user has in Supabase and write
 * it into the same localStorage keys the guest (no-account) app reads from, so
 * the browser becomes the source of truth again. Returns the pulled data so the
 * caller can also offer a JSON file backup.
 */
export async function exportCloudToLocal(userId: string): Promise<CloudExport> {
  const sb = createClient()
  const [todos, completions, globalTags, tagColors] = await Promise.all([
    fetchTodos(sb, userId),
    fetchCompletions(sb, userId),
    fetchGlobalTags(sb, userId),
    fetchTagColors(sb, userId),
  ])

  saveTodos(todos)
  saveCompletions(completions)
  saveGlobalTags(globalTags)
  saveTagColors(tagColors)

  return {
    exportedAt: new Date().toISOString(),
    todos,
    completions,
    globalTags,
    tagColors,
  }
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
