import { prisma } from "../../src/db/prisma";

export async function resetDb() {
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}
