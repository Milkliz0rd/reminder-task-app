import bcrypt from "bcrypt";
import { prisma } from "../../src/db/prisma";
import jwt from "jsonwebtoken";
import "dotenv/config";

export async function createAuthUser(
  email: string,
  password: string,
): Promise<{
  user: { id: number; email: string };
  token: string;
}> {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      password_hash: hash,
    },
  });
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "1h" });

  return { user: { id: user.id, email: user.email }, token };
}
