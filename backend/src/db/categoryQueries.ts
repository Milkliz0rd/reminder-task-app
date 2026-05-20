import { prisma } from "./prisma";

export async function getAllCategory(userId: number) {
  return await prisma.category.findMany({
    where: { userId: userId },
  });
}

export async function createCategory(userId: number, data: { name: string }) {
  return await prisma.category.create({
    data: {
      name: data.name,
      userId: userId,
    },
  });
}

export async function updateCategory(
  categoryId: number,
  userId: number,
  data: { name?: string },
) {
  return await prisma.category.update({
    where: {
      userId: userId,
      id: categoryId,
    },
    data: {
      name: data.name,
    },
  });
}

export async function removeCategory(categoryId: number, userId: number) {
  return await prisma.category.delete({
    where: {
      userId: userId,
      id: categoryId,
    },
  });
}
