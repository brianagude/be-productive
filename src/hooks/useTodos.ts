'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Todo, Status, Priority } from '@/lib/types'
import {
  getTodos, saveTodos, runStartupCleanup,
  renameGlobalTag, deleteGlobalTag,
  addCompletion as addCompletionLocal,
  addGlobalTag, setTagColor as setTagColorLocal,
  getGlobalTags, getTagColors,
  saveGlobalTags as saveGlobalTagsLocal, saveTagColors,
  getCompletions, clearCompletions,
} from '@/lib/storage'
import { pruneTimeSpent } from '@/lib/pomodoroStorage'
import { createClient } from '@/lib/supabase/client'
import {
  fetchTodos, upsertTodo, deleteTodo as dbDeleteTodo,
  addCompletion as dbAddCompletion,
  fetchCompletions,
  fetchGlobalTags, saveGlobalTags as dbSaveGlobalTags,
  fetchTagColors, upsertTagColor, deleteTagColor,
} from '@/lib/supabase/db'
import { toast } from 'sonner'
import { useAuthContext } from '@/contexts/AuthContext'

export function useTodos() {
  const { user, useCloud } = useAuthContext()
  const [todos, setTodos] = useState<Todo[]>([])
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const todosRef = useRef<Todo[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!useCloud) {
      const raw = getTodos()
      const { todos: cleaned, changed } = runStartupCleanup(raw)
      if (changed) saveTodos(cleaned)
      pruneTimeSpent(cleaned.map(t => t.id))
      todosRef.current = cleaned
      setTodos(cleaned)
      setGlobalTags(getGlobalTags())
      setTagColors(getTagColors())
      return
    }

    const supabase = createClient()
    ;(async () => {
      try {
        const [dbTodos, dbTags, dbTagColors, dbCompletions] = await Promise.all([
          fetchTodos(supabase, user!.id),
          fetchGlobalTags(supabase, user!.id),
          fetchTagColors(supabase, user!.id),
          fetchCompletions(supabase, user!.id),
        ])

        // Migrate any local-only items to DB (production only — skip on localhost
        // to avoid polluting the DB with dev/test data).
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        const dbIds = new Set(dbTodos.map(t => t.id))
        const localOnly = isLocalhost ? [] : getTodos().filter(t => !dbIds.has(t.id))
        if (localOnly.length > 0) {
          await Promise.all(localOnly.map(t => upsertTodo(supabase, user!.id, t)))
          toast.success(
            `Imported ${localOnly.length} task${localOnly.length === 1 ? '' : 's'} from this browser`,
            { duration: 4000 }
          )
        }

        const localTags = isLocalhost ? [] : getGlobalTags()
        const mergedTags = Array.from(new Set([...dbTags, ...localTags]))
        if (mergedTags.length > dbTags.length) {
          await dbSaveGlobalTags(supabase, user!.id, mergedTags)
        }

        const localColors = isLocalhost ? {} : getTagColors()
        const newColors = Object.entries(localColors).filter(([tag]) => !dbTagColors[tag])
        if (newColors.length > 0) {
          await Promise.all(newColors.map(([tag, color]) => upsertTagColor(supabase, user!.id, tag, color)))
        }

        // Clear localStorage — DB is now the source of truth. Components read
        // from React state (not localStorage), so nothing breaks.
        saveTodos([])
        saveGlobalTagsLocal([])
        saveTagColors({})

        // Migrate local completion history to DB. Completions are permanent in the
        // DB (never purged) so stats remain accurate for logged-in users.
        const localCompletions = isLocalhost ? [] : getCompletions()
        if (localCompletions.length > 0) {
          const dbTimes = new Set(dbCompletions.map(c => c.completedAt))
          const localOnlyCompletions = localCompletions.filter(c => !dbTimes.has(c.completedAt))
          if (localOnlyCompletions.length > 0) {
            await Promise.all(localOnlyCompletions.map(c => dbAddCompletion(supabase, user!.id, c)))
          }
        }
        clearCompletions()

        const finalColors = { ...dbTagColors, ...Object.fromEntries(newColors) }
        const allTodos = [...dbTodos, ...localOnly]
        const { todos: cleaned, changed } = runStartupCleanup(allTodos, { skipPurge: true })
        pruneTimeSpent(cleaned.map(t => t.id))
        todosRef.current = cleaned
        setTodos(cleaned)
        setGlobalTags(mergedTags)
        setTagColors(finalColors)

        if (changed) {
          const original = new Map(allTodos.map(t => [t.id, t]))
          const resetTodos = cleaned.filter(t => original.get(t.id)?.status !== t.status)
          await Promise.all(resetTodos.map(t => upsertTodo(supabase, user!.id, t)))
        }
      } catch (err) {
        console.error('Failed to load todos from DB:', err)
      }
    })()
  }, [user?.id, useCloud])

  // For cloud users already signed in, re-run the daily/weekly reset whenever
  // the page becomes visible on a new day (the main effect only fires once on sign-in).
  useEffect(() => {
    if (!useCloud) return

    const checkDailyReset = () => {
      if (document.visibilityState !== 'visible') return
      const today = new Date().toDateString()
      if (localStorage.getItem('tiny-tools:lastReset') === today) return

      const now = new Date()
      const todayDow = now.getDay()
      let changed = false
      const updated = todosRef.current.map(t => {
        if (t.status !== 'done' && t.status !== 'cancelled') return t
        if (t.daily || t.weeklyDays?.includes(todayDow)) {
          changed = true
          return { ...t, status: 'todo' as Status, updatedAt: now.toISOString() }
        }
        return t
      })
      localStorage.setItem('tiny-tools:lastReset', today)
      if (changed) {
        const supabase = createClient()
        const original = new Map(todosRef.current.map(t => [t.id, t]))
        const resetTodos = updated.filter(t => original.get(t.id)?.status !== t.status)
        todosRef.current = updated
        setTodos([...updated])
        Promise.all(resetTodos.map(t => upsertTodo(supabase, user!.id, t))).catch(console.error)
      }
    }

    document.addEventListener('visibilitychange', checkDailyReset)
    return () => document.removeEventListener('visibilitychange', checkDailyReset)
  }, [useCloud, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((updated: Todo[]) => {
    setTodos(updated)
    todosRef.current = updated
    if (!useCloud) saveTodos(updated)
  }, [useCloud])

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
    if (useCloud) {
      const supabase = createClient()
      upsertTodo(supabase, user!.id, todo).catch(console.error)
    }
  }, [user, useCloud, persist])

  const updateTodo = useCallback((id: string, changes: Partial<Todo>) => {
    const updated = todosRef.current.map(t =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    )
    persist(updated)
    if (useCloud) {
      const changed = updated.find(t => t.id === id)
      if (changed) {
        const supabase = createClient()
        upsertTodo(supabase, user!.id, changed).catch(console.error)
      }
    }
  }, [user, useCloud, persist])

  const deleteTodo = useCallback((id: string) => {
    persist(todosRef.current.filter(t => t.id !== id))
    if (useCloud) {
      const supabase = createClient()
      dbDeleteTodo(supabase, user!.id, id).catch(console.error)
    }
  }, [user, useCloud, persist])

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
        if (!useCloud) {
          addCompletionLocal(record)
        } else {
          const supabase = createClient()
          dbAddCompletion(supabase, user!.id, record).catch(console.error)
        }
      }
    }
    updateTodo(id, { status: next })
  }, [user, useCloud, updateTodo])

  const renameTag = useCallback((oldName: string, newName: string) => {
    const affected = todosRef.current.filter(t => t.tags.includes(oldName))
    const updated = todosRef.current.map(t =>
      t.tags.includes(oldName)
        ? { ...t, tags: t.tags.map(tag => tag === oldName ? newName : tag), updatedAt: new Date().toISOString() }
        : t
    )
    persist(updated)
    setGlobalTags(prev => prev.map(t => t === oldName ? newName : t))
    setTagColors(prev => {
      if (prev[oldName] === undefined) return prev
      const { [oldName]: color, ...rest } = prev
      return { ...rest, [newName]: color }
    })

    if (!useCloud) {
      renameGlobalTag(oldName, newName)
    } else {
      const supabase = createClient()
      const updatedAffected = updated.filter(t => affected.some(a => a.id === t.id))
      fetchGlobalTags(supabase, user!.id)
        .then(tags => dbSaveGlobalTags(supabase, user!.id, tags.map(t => t === oldName ? newName : t)))
        .catch(console.error)
      fetchTagColors(supabase, user!.id).then(async colors => {
        if (colors[oldName] !== undefined) {
          await upsertTagColor(supabase, user!.id, newName, colors[oldName])
          await deleteTagColor(supabase, user!.id, oldName)
        }
      }).catch(console.error)
      updatedAffected.forEach(t => upsertTodo(supabase, user!.id, t).catch(console.error))
    }
  }, [user, useCloud, persist])

  const deleteTag = useCallback((tagName: string) => {
    const affected = todosRef.current.filter(t => t.tags.includes(tagName))
    const updated = todosRef.current.map(t =>
      t.tags.includes(tagName)
        ? { ...t, tags: t.tags.filter(tag => tag !== tagName), updatedAt: new Date().toISOString() }
        : t
    )
    persist(updated)
    setGlobalTags(prev => prev.filter(t => t !== tagName))
    setTagColors(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== tagName)))

    if (!useCloud) {
      deleteGlobalTag(tagName)
    } else {
      const supabase = createClient()
      const updatedAffected = updated.filter(t => affected.some(a => a.id === t.id))
      fetchGlobalTags(supabase, user!.id)
        .then(tags => dbSaveGlobalTags(supabase, user!.id, tags.filter(t => t !== tagName)))
        .catch(console.error)
      deleteTagColor(supabase, user!.id, tagName).catch(console.error)
      updatedAffected.forEach(t => upsertTodo(supabase, user!.id, t).catch(console.error))
    }
  }, [user, useCloud, persist])

  const addTag = useCallback((tag: string) => {
    setGlobalTags(prev => {
      if (prev.includes(tag)) return prev
      return [...prev, tag]
    })
    if (!useCloud) {
      addGlobalTag(tag)
    } else {
      const supabase = createClient()
      fetchGlobalTags(supabase, user!.id).then(tags => {
        if (!tags.includes(tag)) {
          dbSaveGlobalTags(supabase, user!.id, [...tags, tag]).catch(console.error)
        }
      }).catch(console.error)
    }
  }, [user, useCloud])

  const setTagColor = useCallback((tag: string, color: string) => {
    setTagColors(prev => ({ ...prev, [tag]: color }))
    if (!useCloud) {
      setTagColorLocal(tag, color)
    } else {
      const supabase = createClient()
      upsertTagColor(supabase, user!.id, tag, color).catch(console.error)
    }
  }, [user, useCloud])

  return { todos, globalTags, tagColors, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag, addTag, setTagColor }
}
