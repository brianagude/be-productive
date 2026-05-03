'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type User } from '@supabase/supabase-js'
import { Todo, Status, Priority } from '@/lib/types'
import {
  getTodos, saveTodos, runStartupCleanup,
  renameGlobalTag, deleteGlobalTag,
  addCompletion as addCompletionLocal,
} from '@/lib/storage'
import { pruneTimeSpent } from '@/lib/pomodoroStorage'
import { createClient } from '@/lib/supabase/client'
import {
  fetchTodos, upsertTodo, deleteTodo as dbDeleteTodo,
  addCompletion as dbAddCompletion,
  fetchGlobalTags, saveGlobalTags as dbSaveGlobalTags,
  fetchTagColors, upsertTagColor, deleteTagColor,
  isMigrated, migrateFromLocalStorage,
} from '@/lib/supabase/db'
import posthog from 'posthog-js'

export function useTodos(user: User | null = null) {
  const [todos, setTodos] = useState<Todo[]>([])
  const todosRef = useRef<Todo[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) {
      const raw = getTodos()
      const { todos: cleaned, changed } = runStartupCleanup(raw)
      if (changed) saveTodos(cleaned)
      pruneTimeSpent(cleaned.map(t => t.id))
      todosRef.current = cleaned
      setTodos(cleaned)
      return
    }

    const supabase = createClient()
    ;(async () => {
      try {
        const migrated = await isMigrated(supabase, user.id)
        if (!migrated) await migrateFromLocalStorage(supabase, user.id)

        const dbTodos = await fetchTodos(supabase, user.id)
        const { todos: cleaned, changed } = runStartupCleanup(dbTodos, { skipPurge: true })
        pruneTimeSpent(cleaned.map(t => t.id))
        todosRef.current = cleaned
        setTodos(cleaned)

        // Persist daily/weekly resets back to DB
        if (changed) {
          const original = new Map(dbTodos.map(t => [t.id, t]))
          const resetTodos = cleaned.filter(t => original.get(t.id)?.status !== t.status)
          await Promise.all(resetTodos.map(t => upsertTodo(supabase, user.id, t)))
        }
      } catch (err) {
        console.error('Failed to load todos from DB:', err)
      }
    })()
  }, [user?.id]) // intentionally using user?.id — stable identity check, not object reference

  const persist = useCallback((updated: Todo[]) => {
    setTodos(updated)
    todosRef.current = updated
    if (!user) saveTodos(updated)
  }, [user])

  const addTodo = useCallback((
    title: string,
    priority: Priority = 'none',
    daily = false,
    weeklyDays: number[] = [],
    tags: string[] = [],
    deadline?: string,
    description?: string,
    backlog = false
  ) => {
    const now = new Date().toISOString()
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      priority,
      daily,
      weeklyDays,
      backlog,
      tags,
      deadline,
      createdAt: now,
      updatedAt: now,
    }
    persist([...todosRef.current, todo])
    if (user) {
      const supabase = createClient()
      upsertTodo(supabase, user.id, todo).catch(console.error)
    }
  }, [user, persist])

  const updateTodo = useCallback((id: string, changes: Partial<Todo>) => {
    const updated = todosRef.current.map(t =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    )
    persist(updated)
    if (user) {
      const changed = updated.find(t => t.id === id)
      if (changed) {
        const supabase = createClient()
        upsertTodo(supabase, user.id, changed).catch(console.error)
      }
    }
  }, [user, persist])

  const deleteTodo = useCallback((id: string) => {
    posthog.capture('task_deleted')
    persist(todosRef.current.filter(t => t.id !== id))
    if (user) {
      const supabase = createClient()
      dbDeleteTodo(supabase, user.id, id).catch(console.error)
    }
  }, [user, persist])

  const cycleStatus = useCallback((id: string, current: Status) => {
    const cycle: Status[] = ['todo', 'in-progress', 'done', 'cancelled']
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
    if (next === 'done') {
      const todo = todosRef.current.find(t => t.id === id)
      if (todo) {
        const now = new Date().toISOString()
        const record = {
          todoId: id,
          title: todo.title,
          tags: todo.tags,
          date: now.slice(0, 10),
          completedAt: now,
        }
        posthog.capture('task_completed')
        if (!user) {
          addCompletionLocal(record)
        } else {
          const supabase = createClient()
          dbAddCompletion(supabase, user.id, record).catch(console.error)
        }
      }
    }
    updateTodo(id, { status: next })
  }, [user, updateTodo])

  const renameTag = useCallback((oldName: string, newName: string) => {
    const affected = todosRef.current.filter(t => t.tags.includes(oldName))
    const updated = todosRef.current.map(t =>
      t.tags.includes(oldName)
        ? { ...t, tags: t.tags.map(tag => tag === oldName ? newName : tag), updatedAt: new Date().toISOString() }
        : t
    )
    persist(updated)

    if (!user) {
      renameGlobalTag(oldName, newName)
    } else {
      const supabase = createClient()
      const updatedAffected = updated.filter(t => affected.some(a => a.id === t.id))
      fetchGlobalTags(supabase, user.id)
        .then(tags => dbSaveGlobalTags(supabase, user.id, tags.map(t => t === oldName ? newName : t)))
        .catch(console.error)
      fetchTagColors(supabase, user.id).then(async colors => {
        if (colors[oldName] !== undefined) {
          await upsertTagColor(supabase, user.id, newName, colors[oldName])
          await deleteTagColor(supabase, user.id, oldName)
        }
      }).catch(console.error)
      updatedAffected.forEach(t => upsertTodo(supabase, user.id, t).catch(console.error))
    }
  }, [user, persist])

  const deleteTag = useCallback((tagName: string) => {
    const affected = todosRef.current.filter(t => t.tags.includes(tagName))
    const updated = todosRef.current.map(t =>
      t.tags.includes(tagName)
        ? { ...t, tags: t.tags.filter(tag => tag !== tagName), updatedAt: new Date().toISOString() }
        : t
    )
    persist(updated)

    if (!user) {
      deleteGlobalTag(tagName)
    } else {
      const supabase = createClient()
      const updatedAffected = updated.filter(t => affected.some(a => a.id === t.id))
      fetchGlobalTags(supabase, user.id)
        .then(tags => dbSaveGlobalTags(supabase, user.id, tags.filter(t => t !== tagName)))
        .catch(console.error)
      deleteTagColor(supabase, user.id, tagName).catch(console.error)
      updatedAffected.forEach(t => upsertTodo(supabase, user.id, t).catch(console.error))
    }
  }, [user, persist])

  return { todos, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag }
}
