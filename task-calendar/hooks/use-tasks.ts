"use client"

// タスク管理用のカスタムフック
import { useState, useEffect } from "react"
import { type Task, getTasks, addTask, updateTask, deleteTask } from "@/lib/firebase-tasks"

export const useTasks = (userId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // タスクを読み込み
  const loadTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await getTasks(userId)
      setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      setError("タスクの読み込みに失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // タスクを追加
  const createTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    try {
      const taskId = await addTask(taskData)
      const newTask: Task = {
        ...taskData,
        id: taskId,
        createdAt: new Date().toISOString(),
      }
      setTasks((prev) => [newTask, ...prev])
      return taskId
    } catch (err) {
      setError("タスクの追加に失敗しました")
      throw err
    }
  }

  // タスクを更新
  const modifyTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates)
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
    } catch (err) {
      setError("タスクの更新に失敗しました")
      throw err
    }
  }

  // タスクを削除
  const removeTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch (err) {
      setError("タスクの削除に失敗しました")
      throw err
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadTasks()
  }, [userId])

  return {
    tasks,
    loading,
    error,
    createTask,
    modifyTask,
    removeTask,
    refreshTasks: loadTasks,
  }
}
