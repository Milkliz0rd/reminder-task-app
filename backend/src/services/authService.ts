import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import 'dotenv/config'

export async function registerUser(email: string, password: string) {
  const isNotUnique = await prisma.user.findUnique({ where: { email } });
  if (isNotUnique) {
    throw new Error('Email already taken')
  }
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email: email,
      password_hash: hash,
    },
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Credentials are not correct')
  }
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw new Error("Credentials are not correct");
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined')
  }
  return jwt.sign({userId: user.id}, secret, {expiresIn: '1h'} )
}
