'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Todo, Status, Priority } from '@/lib/types'
import {
  getTodos, saveTodos, runStartupCleanup,
  renameGlobalTag, deleteGlobalTag,
  addCompletion as addCompletionLocal,
  addGlobalTag, setTagColor as setTagColorLocal,
  getGlobalTags, getTagColors,
} from '@/lib/storage'
import { pruneTimeSpent } from '@/lib/pomodoroStorage'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const todosRef = useRef<Todo[]>([])

  useEffect(() => {
    const raw = getTodos()
    const { todos: cleaned, changed } = runStartupCleanup(raw)
    if (changed) saveTodos(cleaned)
    pruneTimeSpent(cleaned.map(t => t.id))
    todosRef.current = cleaned
    setTodos(cleaned)
    setGlobalTags(getGlobalTags())
    setTagColors(getTagColors())
  }, [])

  const persist = useCallback((updated: Todo[]) => {
    setTodos(updated)
    todosRef.current = updated
    saveTodos(updated)
  }, [])

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
  }, [persist])

  const updateTodo = useCallback((id: string, changes: Partial<Todo>) => {
    const updated = todosRef.current.map(t =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    )
    persist(updated)
  }, [persist])

  const deleteTodo = useCallback((id: string) => {
    persist(todosRef.current.filter(t => t.id !== id))
  }, [persist])

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
        addCompletionLocal(record)
      }
    }
    updateTodo(id, { status: next })
  }, [updateTodo])

  const renameTag = useCallback((oldName: string, newName: string) => {
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
    renameGlobalTag(oldName, newName)
  }, [persist])

  const deleteTag = useCallback((tagName: string) => {
    const updated = todosRef.current.map(t =>
      t.tags.includes(tagName)
        ? { ...t, tags: t.tags.filter(tag => tag !== tagName), updatedAt: new Date().toISOString() }
        : t
    )
    persist(updated)
    setGlobalTags(prev => prev.filter(t => t !== tagName))
    setTagColors(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== tagName)))
    deleteGlobalTag(tagName)
  }, [persist])

  const addTag = useCallback((tag: string) => {
    setGlobalTags(prev => (prev.includes(tag) ? prev : [...prev, tag]))
    addGlobalTag(tag)
  }, [])

  const setTagColor = useCallback((tag: string, color: string) => {
    setTagColors(prev => ({ ...prev, [tag]: color }))
    setTagColorLocal(tag, color)
  }, [])

  return { todos, globalTags, tagColors, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag, addTag, setTagColor }
}
