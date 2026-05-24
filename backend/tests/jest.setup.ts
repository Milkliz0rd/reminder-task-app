import { resetDb } from "./helpers/resetDb";
import {prisma } from "../src/db/prisma"
beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect();
});