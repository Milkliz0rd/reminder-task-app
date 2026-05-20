import {
  createTask as createTaskFromService,
  getAllTasks as getAllTasksInService,
  updateTask as updateTaskInService,
  removeTask as removeTaskInService,
} from "../services/taskService";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

export async function getAllTasks(request: AuthRequest, response: Response) {
  const userId = request.userId;
  const { done, priority, deadline } = request.query
  const doneFilter = done === "true" ? true : done === "false" ? false : undefined
  const priorityFilter = priority as "LOW" | "MEDIUM" | "HIGH" | undefined;
  const deadlineFilter = deadline ? new Date(deadline as string) : undefined;
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    const tasks = await getAllTasksInService(userId, doneFilter, priorityFilter, deadlineFilter);
    return response.status(200).json({ tasks });
  } catch {
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function createTask(request: AuthRequest, response: Response) {
  const userId = request.userId;
  const taskData = request.body;
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  if (!taskData.title) {
    return response.status(400).json({ message: "title is required" });
  }
  if (!taskData.deadline) {
    return response.status(400).json({ message: "deadline is required" });
  }
  try {
    const task = await createTaskFromService(userId, taskData);
    return response.status(201).json({ task });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "The date is earlier than today") {
        return response.status(400).json({ message: error.message });
      }
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTask(request: AuthRequest, response: Response) {
  const taskId = parseInt(request.params.id as string);
  const userId = request.userId;
  const taskData = request.body;
  if (isNaN(taskId)) {
    return response.status(404).json({ message: "This task doesn't exist !" });
  }
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    const taskUpdated = await updateTaskInService(taskId, userId, taskData);
    return response.status(200).json({ taskUpdated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "The date is earlier than today") {
        return response.status(400).json({ message: error.message });
      }
    }
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return response.status(404).json({ message: "Task not found" });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function removeTask(request: AuthRequest, response: Response) {
  const taskId = parseInt(request.params.id as string);
  const userId = request.userId;
  if (isNaN(taskId)) {
    return response.status(404).json({ message: "This task doesn't exist !" });
  }
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    await removeTaskInService(taskId, userId);
    return response.status(204).send();
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return response.status(404).json({ message: "Task not found" });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}
