import {
  createTask as createTaskInDb,
  getAllTasks as getAllTasksInDb,
  updateTask as updateTaskInDb,
  removeTask as removeTaskInDb
} from "../db/taskQueries";

type TaskData = {
  title: string
  deadline: Date
  description?: string
  priority?: "LOW" | "MEDIUM" | "HIGH"
  categoryId?: number
}

export async function getAllTasks(
  userId: number,
  done?: boolean,
  priority?: "LOW" | "MEDIUM" | "HIGH",
  deadline?: Date,
) {
  return getAllTasksInDb(userId, done, priority, deadline);
}

export async function createTask(userId: number, data: TaskData) {
  if (data.deadline < new Date()) {
    throw new Error('The date is earlier than today')
  }
  return createTaskInDb(userId, data)
}

export function updateTask(taskId: number, userId: number, data: TaskData) {
  if (data.deadline && data.deadline < new Date()) {
    throw new Error("The date is earlier than today");
  }
  return updateTaskInDb(userId, taskId, data);
}

export function removeTask(taskId: number, userId: number) {
  return removeTaskInDb(taskId, userId)
}