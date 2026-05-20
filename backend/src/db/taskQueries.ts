import { prisma } from "./prisma";

export async function getAllTasks(
  userId: number,
  done?: boolean,
  priority?: "LOW" | "MEDIUM" | "HIGH",
  deadline?: Date
) {
  return await prisma.task.findMany({
    where: {
      userId: userId,
      done: done,
      priority: priority,
      deadline: deadline ? { lte: deadline } : undefined 
    },
  });
}

export async function createTask(
  userId: number,
  data: {
    title: string,
    deadline: Date,
    description?: string,
    priority?: "LOW" | "MEDIUM" | 'HIGH',
    categoryId?: number
  },
) {
  return await prisma.task.create({
    data: {
      userId: userId,
      title: data.title,
      deadline: data.deadline,
      description: data.description,
      priority: data.priority,
      categoryId: data.categoryId
    },
  });
}

export async function updateTask(
  taskId: number,
  userId: number,
  data: {
    title?: string;
    deadline?: Date;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    done?: boolean
  },
) {
  return await prisma.task.update({
    where: {
      userId: userId,
      id: taskId
    },
    data: {
      title: data.title,
      deadline: data.deadline,
      description: data.description,
      priority: data.priority,
      done: data.done
    },
  });
}

export async function removeTask(taskId: number, userId: number) {
  return await prisma.task.delete({
    where: {
      userId: userId,
      id: taskId
    }
  })
}