import instance from "../api/api";
import type { Task } from "../types/task";

export async function getTasks() {
  const response = await instance.get<{ tasks: Task[] }>("/tasks");
  return response.data.tasks;
}
