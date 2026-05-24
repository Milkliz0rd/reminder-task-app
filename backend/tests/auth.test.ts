import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";
import bcrypt from "bcrypt";

// REGISTER
describe("POST /auth/register", () => {
  it("Create a new user and return 201 status", async () => {
    // ARRANGE
    // DB empty with global beforeEach(resetDb)

    // ACT
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password1234" });

    // ASSERT - on HTTP response
    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User created with success");
    // ASSERT - on DB effect
    const users = await prisma.user.findMany();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("test@test.com");
    expect(users[0].password_hash).not.toBe("password1234"); // Hashed with bcrypt
  });

  it("Conflict with an email already taken", async () => {
    // ARRANGE
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password_hash: "password1234",
      },
    });

    // ACT
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password1234" });

    // ASSERT
    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already taken");
    const users = await prisma.user.findMany();
    expect(users.length).toBe(1);
  });
});

// ---------------------- LOGIN ----------------------------

describe("POST /auth/login", () => {
  // ----- Login Nominal -----
  it("login nominal - 200 + token", async () => {
    const hash = await bcrypt.hash("password1234", 10);
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password_hash: hash,
      },
    });
    // ACT - Login
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password1234" });
    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  // ----- Wrong Password -----
  it("Wrong password - 401", async () => {
    // ARRANGE
    const hash = await bcrypt.hash("password1234", 10);
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password_hash: hash,
      },
    });
    // ACT
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "wrongPassword" });
    // ASSERT
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credentials are not correct");
  });

  // ----- Nonexistent User -----
  it("Nonexistent user - 401", async () => {
    // ARRANGE

    // ACT
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password1234" });
    // ASSERT
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credentials are not correct");
  });
});
