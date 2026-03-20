'use client'

import { useState, useEffect, useCallback } from 'react'
import { Todo, Status, Priority } from '@/lib/types'
import { getTodos, saveTodos, runStartupCleanup, renameGlobalTag, deleteGlobalTag, addCompletion } from '@/lib/storage'
import { pruneTimeSpent } from '@/lib/pomodoroStorage'
import posthog from 'posthog-js'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const raw = getTodos()
    const { todos: cleaned, changed } = runStartupCleanup(raw)
    if (changed) saveTodos(cleaned)
    pruneTimeSpent(cleaned.map(t => t.id))
    setTodos(cleaned)
  }, [])

  const persist = useCallback((updated: Todo[]) => {
    setTodos(updated)
    saveTodos(updated)
  }, [])

  const addTodo = useCallback((
    title: string,
    priority: Priority = 'none',
    daily = false,
    tags: string[] = [],
    deadline?: string,
    description?: string
  ) => {
    const now = new Date().toISOString()
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      priority,
      daily,
      tags,
      deadline,
      createdAt: now,
      updatedAt: now,
    }
    persist([...getTodos(), todo])
  }, [persist])

  const updateTodo = useCallback((id: string, changes: Partial<Todo>) => {
    const current = getTodos()
    persist(current.map(t =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    ))
  }, [persist])

  const deleteTodo = useCallback((id: string) => {
    posthog.capture('task_deleted')
    persist(getTodos().filter(t => t.id !== id))
  }, [persist])

  const cycleStatus = useCallback((id: string, current: Status) => {
    const cycle: Status[] = ['todo', 'in-progress', 'done', 'cancelled']
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
    if (next === 'done') {
      const todo = getTodos().find(t => t.id === id)
      if (todo) {
        const now = new Date().toISOString()
        addCompletion({ todoId: id, title: todo.title, tags: todo.tags, date: now.slice(0, 10), completedAt: now })
        posthog.capture('task_completed')
      }
    }
    updateTodo(id, { status: next })
  }, [updateTodo])

  // Atomically rename a tag across all todos in one persist call
  const renameTag = useCallback((oldName: string, newName: string) => {
    renameGlobalTag(oldName, newName)
    const current = getTodos()
    persist(current.map(t =>
      t.tags.includes(oldName)
        ? { ...t, tags: t.tags.map(tag => tag === oldName ? newName : tag), updatedAt: new Date().toISOString() }
        : t
    ))
  }, [persist])

  // Atomically delete a tag from global list and all todos
  const deleteTag = useCallback((tagName: string) => {
    deleteGlobalTag(tagName)
    const current = getTodos()
    persist(current.map(t =>
      t.tags.includes(tagName)
        ? { ...t, tags: t.tags.filter(tag => tag !== tagName), updatedAt: new Date().toISOString() }
        : t
    ))
  }, [persist])

  return { todos, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag }
}
