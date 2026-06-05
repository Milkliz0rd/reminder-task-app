import { prisma } from "./prisma";

export async function getUsersWithPendingTasks() {
  return await prisma.user.findMany({
    where: {
      tasks: {
        some: {
          done: false,
        },
      },
    },
    include: {
      tasks: {
        where: {
          done: false,
        },
      },
    },
  });
}
