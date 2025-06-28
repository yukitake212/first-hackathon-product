import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Taskインターフェースを更新
export interface Task {
  id: string
  title: string
  description: string
  date: string
  startDate: string // 全てのタスクに開始日を追加（必須）
  dueDate?: string // 期限日
  endDate?: string // 終了日（期間タスク用）
  taskType: "single" | "period" // タスクタイプ
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: string
  userId?: string
  subtasks?: SubTask[] // サブタスクを追加
}

// サブタスクインターフェースを追加
export interface SubTask {
  id: string
  title: string
  description: string
  completed: boolean
  dueDate?: string
}

const TASKS_COLLECTION = "tasks"

// タスクを追加
export const addTask = async (task: Omit<Task, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...task,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding task:", error)
    throw error
  }
}

// タスクを更新
export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId)
    await updateDoc(taskRef, updates)
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

// タスクを削除
export const deleteTask = async (taskId: string) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId)
    await deleteDoc(taskRef)
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

// 全タスクを取得
export const getTasks = async (userId?: string) => {
  try {
    let q = query(collection(db, TASKS_COLLECTION), orderBy("createdAt", "desc"))

    if (userId) {
      q = query(collection(db, TASKS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"))
    }

    const querySnapshot = await getDocs(q)
    const tasks: Task[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        date: data.date,
        dueDate: data.dueDate,
        startDate: data.startDate,
        endDate: data.endDate,
        taskType: data.taskType || "single",
        priority: data.priority,
        completed: data.completed,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: data.userId,
        subtasks: data.subtasks,
      })
    })

    return tasks
  } catch (error) {
    console.error("Error getting tasks:", error)
    throw error
  }
}

// 特定の日付のタスクを取得
export const getTasksByDate = async (date: string, userId?: string) => {
  try {
    let q = query(collection(db, TASKS_COLLECTION), where("date", "==", date), orderBy("createdAt", "desc"))

    if (userId) {
      q = query(
        collection(db, TASKS_COLLECTION),
        where("date", "==", date),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      )
    }

    const querySnapshot = await getDocs(q)
    const tasks: Task[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        date: data.date,
        dueDate: data.dueDate,
        startDate: data.startDate,
        endDate: data.endDate,
        taskType: data.taskType || "single",
        priority: data.priority,
        completed: data.completed,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: data.userId,
        subtasks: data.subtasks,
      })
    })

    return tasks
  } catch (error) {
    console.error("Error getting tasks by date:", error)
    throw error
  }
}

// 期間内のタスクを取得
export const getTasksInPeriod = async (startDate: string, endDate: string, userId?: string) => {
  try {
    let q = query(collection(db, TASKS_COLLECTION), where("taskType", "==", "period"), orderBy("createdAt", "desc"))

    if (userId) {
      q = query(
        collection(db, TASKS_COLLECTION),
        where("taskType", "==", "period"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      )
    }

    const querySnapshot = await getDocs(q)
    const tasks: Task[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const task = {
        id: doc.id,
        title: data.title,
        description: data.description,
        date: data.date,
        dueDate: data.dueDate,
        startDate: data.startDate,
        endDate: data.endDate,
        taskType: data.taskType || "single",
        priority: data.priority,
        completed: data.completed,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: data.userId,
        subtasks: data.subtasks,
      }

      // 期間が重複するタスクをフィルタリング
      if (task.startDate && task.endDate) {
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        const periodStart = new Date(startDate)
        const periodEnd = new Date(endDate)

        if (taskStart <= periodEnd && taskEnd >= periodStart) {
          tasks.push(task)
        }
      }
    })

    return tasks
  } catch (error) {
    console.error("Error getting tasks in period:", error)
    throw error
  }
}

// 期限切れのタスクを取得
export const getOverdueTasks = async (userId?: string) => {
  try {
    const today = new Date().toISOString().split("T")[0]
    let q = query(
      collection(db, TASKS_COLLECTION),
      where("dueDate", "<", today),
      where("completed", "==", false),
      orderBy("dueDate", "asc"),
    )

    if (userId) {
      q = query(
        collection(db, TASKS_COLLECTION),
        where("dueDate", "<", today),
        where("completed", "==", false),
        where("userId", "==", userId),
        orderBy("dueDate", "asc"),
      )
    }

    const querySnapshot = await getDocs(q)
    const tasks: Task[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        date: data.date,
        dueDate: data.dueDate,
        startDate: data.startDate,
        endDate: data.endDate,
        taskType: data.taskType || "single",
        priority: data.priority,
        completed: data.completed,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: data.userId,
        subtasks: data.subtasks,
      })
    })

    return tasks
  } catch (error) {
    console.error("Error getting overdue tasks:", error)
    throw error
  }
}
