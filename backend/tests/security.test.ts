import request from "supertest";
import app from "../src/app";
import bcrypt from "bcrypt";
import { prisma } from "../src/db/prisma";

describe("Security - SQL injection ", () => {
  it("Login refuses SQL injection attempt - 401", async () => {
    // ARRANGE - legitimate user in db
    const hash = await bcrypt.hash("password1234", 10);
    await prisma.user.create({
      data: { email: "test@test.com", password_hash: hash },
    });
    // ACT - SQL injection attempt in email input
    const response = await request(app).post("/auth/login").send({
      email: "' OR 1=1 --",
      password: "anything",
    });
    // ASSERT — Injection did not circumvent the authentication
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credentials are not correct");
    // ASSERT - Legitimate user longer exists
    const userStillThere = await prisma.user.findUnique({
      where: { email: "test@test.com" },
    });
    expect(userStillThere).not.toBeNull();
  });
});
