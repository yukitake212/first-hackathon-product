// Gemini AI統合用のユーティリティ
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

export interface TaskBreakdownRequest {
  title: string
  description: string
  dueDate?: string
  priority: string
}

export interface TaskBreakdownResponse {
  subtasks: {
    title: string
    description: string
    estimatedDays: number
    priority: "low" | "medium" | "high"
    dependencies?: string[]
  }[]
  suggestions: string[]
}

// モックデータ
const getMockBreakdown = (task: TaskBreakdownRequest): TaskBreakdownResponse => {
  return {
    subtasks: [
      {
        title: `${task.title} - 計画フェーズ`,
        description: "要件定義と計画を立てる",
        estimatedDays: 1,
        priority: "high",
      },
      {
        title: `${task.title} - 実装フェーズ`,
        description: "実際の作業を実行する",
        estimatedDays: 2,
        priority: "medium",
        dependencies: [`${task.title} - 計画フェーズ`],
      },
      {
        title: `${task.title} - 確認フェーズ`,
        description: "結果を確認し、必要に応じて修正する",
        estimatedDays: 1,
        priority: "low",
        dependencies: [`${task.title} - 実装フェーズ`],
      },
    ],
    suggestions: [
      "タスクを小さな単位に分割することで、進捗を把握しやすくなります",
      "依存関係を明確にして、効率的な順序で実行しましょう",
      "各フェーズの完了基準を明確に定義しておくことが重要です",
    ],
  }
}

export async function breakdownTaskWithGemini(task: TaskBreakdownRequest): Promise<TaskBreakdownResponse> {
  // APIキーが設定されていない場合はモックデータを返す
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === "your-gemini-api-key") {
    console.log("Gemini APIキーが設定されていません。モックデータを使用します。")
    // 実際のAPIコールをシミュレートするため少し待機
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return getMockBreakdown(task)
  }

  try {
    // 最新のモデル名を使用
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
タスクを効率的に実行するために、以下のタスクを具体的で実行可能なサブタスクに分割してください。

タスク情報:
- タイトル: ${task.title}
- 説明: ${task.description}
- 期限: ${task.dueDate || "未設定"}
- 優先度: ${task.priority}

以下の形式でJSONレスポンスを返してください:
{
  "subtasks": [
    {
      "title": "具体的なサブタスクのタイトル",
      "description": "詳細な説明",
      "estimatedDays": 実行に必要な推定日数,
      "priority": "low" | "medium" | "high",
      "dependencies": ["依存するサブタスクのタイトル（あれば）"]
    }
  ],
  "suggestions": [
    "タスク実行のための追加提案やヒント"
  ]
}

注意点:
- サブタスクは具体的で実行可能なものにしてください
- 各サブタスクは1-3日で完了できる規模にしてください
- 依存関係がある場合は明記してください
- 日本語で回答してください
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSONレスポンスをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid response format")
    }

    const parsedResponse = JSON.parse(jsonMatch[0])
    return parsedResponse
  } catch (error) {
    console.error("Error breaking down task with Gemini:", error)

    // エラーが発生した場合もモックデータを返す
    console.log("エラーが発生しました。モックデータを使用します。")
    return getMockBreakdown(task)
  }
}

export async function optimizeTaskSchedule(tasks: TaskBreakdownRequest[]): Promise<string[]> {
  // APIキーが設定されていない場合はモック提案を返す
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === "your-gemini-api-key") {
    return [
      "優先度の高いタスクから順番に取り組みましょう",
      "1日に取り組むタスクは3-5個程度に絞ると効果的です",
      "定期的に進捗を確認し、必要に応じて計画を調整しましょう",
      "集中できる時間帯に重要なタスクをスケジュールしましょう",
    ]
  }

  try {
    // 最新のモデル名を使用
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
以下のタスクリストを分析して、効率的なスケジュール提案をしてください:

${tasks
  .map(
    (task, index) => `
${index + 1}. ${task.title}
   説明: ${task.description}
   期限: ${task.dueDate || "未設定"}
   優先度: ${task.priority}
`,
  )
  .join("\n")}

以下の観点から提案してください:
- タスクの優先順位
- 効率的な実行順序
- 時間管理のコツ
- 注意すべきポイント

日本語で箇条書きで回答してください。
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return text.split("\n").filter((line) => line.trim().length > 0)
  } catch (error) {
    console.error("Error optimizing schedule with Gemini:", error)

    // エラーが発生した場合もモック提案を返す
    return [
      "優先度の高いタスクから順番に取り組みましょう",
      "1日に取り組むタスクは3-5個程度に絞ると効果的です",
      "定期的に進捗を確認し、必要に応じて計画を調整しましょう",
    ]
  }
}
