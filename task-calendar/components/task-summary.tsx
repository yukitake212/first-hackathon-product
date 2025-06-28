"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  date: string
  dueDate?: string
  startDate?: string
  endDate?: string
  taskType: "single" | "period"
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: string
}

interface TaskSummaryProps {
  tasks: Task[]
}

export function TaskSummary({ tasks }: TaskSummaryProps) {
  const today = new Date()

  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.completed) return false
    return new Date(task.dueDate) < today
  })

  const dueSoonTasks = tasks.filter((task) => {
    if (!task.dueDate || task.completed) return false
    const dueDate = new Date(task.dueDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  })

  const activePeriodTasks = tasks.filter((task) => {
    if (task.taskType !== "period" || task.completed) return false
    if (!task.startDate || !task.endDate) return false
    const startDate = new Date(task.startDate)
    const endDate = new Date(task.endDate)
    return today >= startDate && today <= endDate
  })

  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">期限切れ</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          <p className="text-xs text-muted-foreground">対応が必要なタスク</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">期限間近</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{dueSoonTasks.length}</div>
          <p className="text-xs text-muted-foreground">3日以内に期限</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">進行中の期間タスク</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{activePeriodTasks.length}</div>
          <p className="text-xs text-muted-foreground">現在進行中</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">完了済み</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <p className="text-xs text-muted-foreground">今月完了したタスク</p>
        </CardContent>
      </Card>
    </div>
  )
}
