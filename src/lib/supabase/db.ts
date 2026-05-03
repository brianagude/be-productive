import { SupabaseClient } from '@supabase/supabase-js'
import { Todo, CompletionRecord } from '@/lib/types'

// ── Todos ──────────────────────────────────────────────────────────────────────

export async function fetchTodos(sb: SupabaseClient, userId: string): Promise<Todo[]> {
  const { data, error } = await sb
    .from('todos')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    daily: row.daily,
    weeklyDays: row.weekly_days ?? [],
    backlog: row.backlog ?? false,
    tags: row.tags ?? [],
    deadline: row.deadline ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function upsertTodo(sb: SupabaseClient, userId: string, todo: Todo): Promise<void> {
  const { error } = await sb.from('todos').upsert({
    id: todo.id,
    user_id: userId,
    title: todo.title,
    description: todo.description ?? null,
    status: todo.status,
    priority: todo.priority,
    daily: todo.daily,
    weekly_days: todo.weeklyDays,
    backlog: todo.backlog ?? false,
    tags: todo.tags,
    deadline: todo.deadline ?? null,
    created_at: todo.createdAt,
    updated_at: todo.updatedAt,
  })

  if (error) throw error
}

export async function deleteTodo(sb: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await sb
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Completions ────────────────────────────────────────────────────────────────

export async function fetchCompletions(sb: SupabaseClient, userId: string): Promise<CompletionRecord[]> {
  const { data, error } = await sb
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(row => ({
    todoId: row.todo_id,
    title: row.title,
    tags: row.tags ?? [],
    date: row.date,
    completedAt: row.completed_at,
  }))
}

export async function addCompletion(
  sb: SupabaseClient,
  userId: string,
  record: CompletionRecord
): Promise<void> {
  const { error } = await sb.from('completions').insert({
    user_id: userId,
    todo_id: record.todoId,
    title: record.title,
    tags: record.tags,
    date: record.date,
    completed_at: record.completedAt,
  })

  if (error) throw error
}

// ── Tag colors ─────────────────────────────────────────────────────────────────

export async function fetchTagColors(
  sb: SupabaseClient,
  userId: string
): Promise<Record<string, string>> {
  const { data, error } = await sb
    .from('tag_colors')
    .select('tag, color')
    .eq('user_id', userId)

  if (error) throw error

  return Object.fromEntries((data ?? []).map(row => [row.tag, row.color]))
}

export async function upsertTagColor(
  sb: SupabaseClient,
  userId: string,
  tag: string,
  color: string
): Promise<void> {
  const { error } = await sb
    .from('tag_colors')
    .upsert({ user_id: userId, tag, color })

  if (error) throw error
}

export async function deleteTagColor(
  sb: SupabaseClient,
  userId: string,
  tag: string
): Promise<void> {
  const { error } = await sb
    .from('tag_colors')
    .delete()
    .eq('user_id', userId)
    .eq('tag', tag)

  if (error) throw error
}

// ── Global tags ────────────────────────────────────────────────────────────────

export async function fetchGlobalTags(sb: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await sb
    .from('global_tags')
    .select('tags')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.tags ?? []
}

export async function saveGlobalTags(
  sb: SupabaseClient,
  userId: string,
  tags: string[]
): Promise<void> {
  const { error } = await sb
    .from('global_tags')
    .upsert({ user_id: userId, tags })

  if (error) throw error
}

// ── Profile / migration ────────────────────────────────────────────────────────

export async function isMigrated(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await sb
    .from('profiles')
    .select('migrated')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.migrated ?? false
}

export async function migrateFromLocalStorage(
  sb: SupabaseClient,
  userId: string
): Promise<void> {
  const STORAGE_KEY     = 'tiny-tools:todos'
  const TAGS_KEY        = 'tiny-tools:tags'
  const TAG_COLORS_KEY  = 'tiny-tools:tagColors'
  const COMPLETIONS_KEY = 'tiny-tools:completions'

  // Todos
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const todos: Todo[] = raw ? JSON.parse(raw) : []
    if (todos.length > 0) {
      const rows = todos.map(t => ({
        id: t.id,
        user_id: userId,
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        daily: t.daily,
        weekly_days: t.weeklyDays ?? [],
        backlog: t.backlog ?? false,
        tags: t.tags ?? [],
        deadline: t.deadline ?? null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      }))
      const { error } = await sb.from('todos').upsert(rows)
      if (error) throw error
    }
  } catch { /* skip on parse error */ }

  // Global tags
  try {
    const raw = localStorage.getItem(TAGS_KEY)
    const tags: string[] = raw ? JSON.parse(raw) : []
    if (tags.length > 0) {
      await saveGlobalTags(sb, userId, tags)
    }
  } catch { /* skip on parse error */ }

  // Tag colors
  try {
    const raw = localStorage.getItem(TAG_COLORS_KEY)
    const colors: Record<string, string> = raw ? JSON.parse(raw) : {}
    const entries = Object.entries(colors)
    if (entries.length > 0) {
      const rows = entries.map(([tag, color]) => ({ user_id: userId, tag, color }))
      const { error } = await sb.from('tag_colors').upsert(rows)
      if (error) throw error
    }
  } catch { /* skip on parse error */ }

  // Completions
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    const completions: CompletionRecord[] = raw ? JSON.parse(raw) : []
    if (completions.length > 0) {
      const rows = completions.map(c => ({
        user_id: userId,
        todo_id: c.todoId,
        title: c.title,
        tags: c.tags ?? [],
        date: c.date,
        completed_at: c.completedAt,
      }))
      const { error } = await sb.from('completions').insert(rows)
      if (error) throw error
    }
  } catch { /* skip on parse error */ }

  // Mark migration complete
  const { error } = await sb
    .from('profiles')
    .upsert({ user_id: userId, migrated: true })
  if (error) throw error
}
