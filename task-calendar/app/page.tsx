"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Plus, Edit, Trash2, Clock, Sparkles } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import { TaskSummary } from "@/components/task-summary"
import { TaskBreakdownDialog } from "@/components/task-breakdown-dialog"

// Firebase設定（実際の使用時は環境変数を使用）
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
}

interface SubTask {
  id: string
  title: string
  description: string
  completed: boolean
  dueDate?: string
}

interface Task {
  id: string
  title: string
  description: string
  date: string
  startDate: string // 必須に変更
  dueDate?: string
  endDate?: string
  taskType: "single" | "period"
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: string
  subtasks?: SubTask[]
}

export default function TaskCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false)
  const [taskToBreakdown, setTaskToBreakdown] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState<{
    title: string
    description: string
    priority: "low" | "medium" | "high"
    taskType: "single" | "period"
    startDate: string
    dueDate: string
    endDate: string
  }>({
    title: "",
    description: "",
    priority: "medium",
    taskType: "single",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: "",
    endDate: "",
  })

  // モックデータ（実際のFirebase実装時は削除）
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: "1",
        title: "プロジェクト会議",
        description: "新機能の仕様について議論",
        date: format(new Date(), "yyyy-MM-dd"),
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(new Date(Date.now() + 2 * 86400000), "yyyy-MM-dd"),
        taskType: "single",
        priority: "high",
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "開発スプリント",
        description: "新機能の開発期間",
        date: format(new Date(), "yyyy-MM-dd"),
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd"),
        taskType: "period",
        priority: "medium",
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]
    setTasks(mockTasks)
  }, [])

  const selectedDateTasks = tasks.filter((task) => isSameDay(new Date(task.date), selectedDate))

  const getTasksForDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return []
    }

    return tasks.filter((task) => {
      if (task.taskType === "period" && task.startDate && task.endDate) {
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)

        // 日付の有効性をチェック
        if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
          return false
        }

        return date >= taskStart && date <= taskEnd
      }

      const taskDate = new Date(task.date)
      if (isNaN(taskDate.getTime())) {
        return false
      }

      return isSameDay(taskDate, date)
    })
  }

  const handleAddTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      date: newTask.startDate, // dateをstartDateに合わせる
      startDate: newTask.startDate,
      taskType: newTask.taskType,
      priority: newTask.priority,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    if (newTask.taskType === "single") {
      if (newTask.dueDate) {
        task.dueDate = newTask.dueDate
      }
    } else {
      task.endDate = newTask.endDate || newTask.startDate
    }

    setTasks([...tasks, task])
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      taskType: "single",
      startDate: format(selectedDate, "yyyy-MM-dd"),
      dueDate: "",
      endDate: "",
    })
    setIsDialogOpen(false)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      taskType: task.taskType,
      startDate: task.startDate,
      dueDate: task.dueDate || "",
      endDate: task.endDate || "",
    })
    setIsDialogOpen(true)
  }

  const handleUpdateTask = () => {
    if (!editingTask || !newTask.title.trim()) return

    const updatedTask = {
      ...editingTask,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      taskType: newTask.taskType,
      startDate: newTask.startDate,
      date: newTask.startDate, // dateもstartDateに合わせる
    }

    if (newTask.taskType === "single") {
      updatedTask.dueDate = newTask.dueDate || undefined
      updatedTask.endDate = undefined
    } else {
      updatedTask.endDate = newTask.endDate
      updatedTask.dueDate = undefined
    }

    const updatedTasks = tasks.map((task) => (task.id === editingTask.id ? updatedTask : task))

    setTasks(updatedTasks)
    setEditingTask(null)
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      taskType: "single",
      startDate: format(selectedDate, "yyyy-MM-dd"),
      dueDate: "",
      endDate: "",
    })
    setIsDialogOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return "中"
    }
  }

  const resetDialog = () => {
    setEditingTask(null)
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      taskType: "single",
      startDate: format(selectedDate, "yyyy-MM-dd"),
      dueDate: "",
      endDate: "",
    })
    setIsDialogOpen(false)
  }

  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    return dueDate < today && !task.completed
  }

  const isDueSoon = (task: Task) => {
    if (!task.dueDate) return false
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0 && !task.completed
  }

  const handleBreakdownTask = (task: Task) => {
    setTaskToBreakdown(task)
    setIsBreakdownDialogOpen(true)
  }

  const handleApplyBreakdown = (subtasks: any[]) => {
    if (!taskToBreakdown) return

    // 元のタスクを削除
    const filteredTasks = tasks.filter((task) => task.id !== taskToBreakdown.id)

    // サブタスクを追加
    const newTasks = subtasks.map((subtask) => ({
      ...subtask,
      date: subtask.startDate,
    }))

    setTasks([...filteredTasks, ...newTasks])
    setTaskToBreakdown(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">タスクカレンダー</h1>
          <p className="text-gray-600">日々のタスクを管理しよう</p>
        </div>

        <TaskSummary tasks={tasks} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* カレンダー部分 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {format(selectedDate, "yyyy年MM月", { locale: ja })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ja}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {/* タスク一覧部分 */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{format(selectedDate, "MM月dd日のタスク", { locale: ja })}</CardTitle>
                    <CardDescription>{selectedDateTasks.length}件のタスク</CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTask ? "タスクを編集" : "タスクを追加"}</DialogTitle>
                        <DialogDescription>
                          {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}のタスクを
                          {editingTask ? "編集" : "追加"}します
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">タイトル</Label>
                          <Input
                            id="title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="タスクのタイトルを入力"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">説明</Label>
                          <Textarea
                            id="description"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            placeholder="タスクの詳細を入力"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="startDate">開始日</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newTask.startDate}
                            onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="taskType">タスクタイプ</Label>
                          <Select
                            value={newTask.taskType}
                            onValueChange={(value: "single" | "period") => setNewTask({ ...newTask, taskType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">単発タスク</SelectItem>
                              <SelectItem value="period">期間タスク</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newTask.taskType === "single" && (
                          <div className="grid gap-2">
                            <Label htmlFor="dueDate">期限日（オプション）</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            />
                          </div>
                        )}
                        {newTask.taskType === "period" && (
                          <>
                            <div className="grid gap-2">
                              <Label htmlFor="startDate">開始日</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={newTask.startDate}
                                onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="endDate">終了日</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={newTask.endDate}
                                onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="priority">優先度</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewTask({ ...newTask, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">低</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="high">高</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={resetDialog}>
                          キャンセル
                        </Button>
                        <Button onClick={editingTask ? handleUpdateTask : handleAddTask}>
                          {editingTask ? "更新" : "追加"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>この日にはタスクがありません</p>
                    </div>
                  ) : (
                    selectedDateTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all ${
                          task.completed
                            ? "bg-gray-50 border-gray-200 opacity-60"
                            : isOverdue(task)
                              ? "bg-red-50 border-red-200"
                              : isDueSoon(task)
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-white border-gray-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleComplete(task.id)}
                                className="rounded border-gray-300"
                              />
                              <h4
                                className={`font-medium truncate ${
                                  task.completed ? "line-through text-gray-500" : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </h4>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </Badge>
                              {newTask.taskType === "period" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                                >
                                  期間
                                </Badge>
                              )}
                              {isOverdue(task) && (
                                <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                                  期限切れ
                                </Badge>
                              )}
                              {isDueSoon(task) && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200"
                                >
                                  期限間近
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className={`text-sm mb-1 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>開始: {format(new Date(task.startDate), "MM/dd", { locale: ja })}</span>
                              {task.taskType === "single" && task.dueDate && (
                                <span>期限: {format(new Date(task.dueDate), "MM/dd", { locale: ja })}</span>
                              )}
                              {task.taskType === "period" && task.endDate && (
                                <span>終了: {format(new Date(task.endDate), "MM/dd", { locale: ja })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBreakdownTask(task)}
                              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                              title="AIでタスクを分割"
                            >
                              <Sparkles className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <TaskBreakdownDialog
        task={taskToBreakdown}
        isOpen={isBreakdownDialogOpen}
        onClose={() => setIsBreakdownDialogOpen(false)}
        onApplyBreakdown={handleApplyBreakdown}
      />
    </div>
  )
}
