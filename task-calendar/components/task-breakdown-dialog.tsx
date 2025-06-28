"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { breakdownTaskWithGemini, type TaskBreakdownResponse } from "@/lib/gemini"

interface Task {
  id: string
  title: string
  description: string
  date: string
  startDate: string
  dueDate?: string
  endDate?: string
  taskType: "single" | "period"
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: string
}

interface TaskBreakdownDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onApplyBreakdown: (subtasks: any[]) => void
}

export function TaskBreakdownDialog({ task, isOpen, onClose, onApplyBreakdown }: TaskBreakdownDialogProps) {
  const [breakdown, setBreakdown] = useState<TaskBreakdownResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBreakdown = async () => {
    if (!task) return

    setLoading(true)
    setError(null)

    try {
      const result = await breakdownTaskWithGemini({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
      })
      setBreakdown(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!breakdown || !task) return

    const subtasks = breakdown.subtasks.map((subtask, index) => ({
      id: `${task.id}-sub-${index}`,
      title: subtask.title,
      description: subtask.description,
      startDate: task.startDate,
      dueDate: task.dueDate,
      taskType: "single" as const,
      priority: subtask.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      estimatedDays: subtask.estimatedDays,
      dependencies: subtask.dependencies,
    }))

    onApplyBreakdown(subtasks)
    onClose()
    setBreakdown(null)
  }

  const handleClose = () => {
    onClose()
    setBreakdown(null)
    setError(null)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AIタスク分割
          </DialogTitle>
          <DialogDescription>Gemini AIがタスクを効率的なサブタスクに分割します</DialogDescription>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
            </Card>

            {!breakdown && !loading && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-600 opacity-50" />
                <p className="text-gray-600 mb-4">AIがタスクを分析して、実行しやすいサブタスクに分割します</p>
                <Button onClick={handleBreakdown} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  タスクを分割する
                </Button>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
                <p className="text-gray-600">AIがタスクを分析中...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleBreakdown} variant="outline">
                  再試行
                </Button>
              </div>
            )}

            {breakdown && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">提案されたサブタスク</h3>
                  <div className="space-y-3">
                    {breakdown.subtasks.map((subtask, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{subtask.title}</h4>
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask.priority)}`}>
                                  {getPriorityLabel(subtask.priority)}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {subtask.estimatedDays}日
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{subtask.description}</p>
                              {subtask.dependencies && subtask.dependencies.length > 0 && (
                                <div className="text-xs text-gray-500">依存: {subtask.dependencies.join(", ")}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {breakdown.suggestions && breakdown.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">AIからの提案</h3>
                    <Card>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {breakdown.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          {breakdown && (
            <Button onClick={handleApply} className="bg-purple-600 hover:bg-purple-700">
              サブタスクを適用
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
