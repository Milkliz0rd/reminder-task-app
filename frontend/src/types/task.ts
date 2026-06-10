export interface Task {
  id: number, 
  title: string,
  description?: string,
  deadline: string,
  priority: "LOW" | "MEDIUM" | "HIGH",
  done: boolean
}