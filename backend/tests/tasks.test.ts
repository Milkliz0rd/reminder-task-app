import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";
import { createAuthUser } from "./helpers/authTestUser";

/** ---------------  POST TASK ----------------- */

describe("POST /tasks", () => {
  // ---- Nominal post task ----
  it("Create task for authenticated user - 201", async () => {
    // ARRANGE - Create a user + token
    const { user, token } = await createAuthUser(
      "test@test.com",
      "password1234",
    );
    // ACT - Post with token
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Acheter du pain",
        deadline: new Date("2027-01-01"),
        priority: "HIGH",
      });
    // ASSERT - HTTP
    expect(response.status).toBe(201);
    expect(response.body.task).toBeDefined();
    expect(response.body.task.title).toBe("Acheter du pain");
    expect(response.body.task.userId).toBe(user.id);
    // ASSERT - DB
    const tasks = await prisma.task.findMany();
    expect(tasks.length).toBe(1);
    expect(tasks[0].userId).toBe(user.id);
  });

  // ---- POST TASK WITHOUT TOKEN ----
  it("Create task refused without token - 401", async () => {
    // ARRANGE - nothing

    // ACT
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "...",
        deadline: new Date("2027-01-01"),
        priority: "HIGH",
      });

    // ASSERT
    expect(response.status).toBe(401);
  });

  // ---- POST TASK WITHOUT TITLE ----
  it("Create task refused without title - 400", async () => {
    //ARRANGE
    const { token } = await createAuthUser("test@test.com", "password1234");

    // ACT
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        deadline: new Date("2027-01-01"),
        priority: "HIGH",
      });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("title is required");
  });
});

/** ------------------- GET TASKS ------------------- */

describe("GET /tasks", () => {
  it("List only tasks of authenticated user - 200", async () => {
    //ARRANGE - create 2 users with token
    const user1 = await createAuthUser("user1@test.com", "pass1234");
    const user2 = await createAuthUser("user2@test.com", "pass1234");

    await prisma.task.createMany({
      data: [
        {
          userId: user1.user.id,
          title: "task1 user1",
          deadline: new Date("2027-01-01"),
        },
        {
          userId: user1.user.id,
          title: "task2 user1",
          deadline: new Date("2027-01-01"),
        },
        {
          userId: user2.user.id,
          title: "task user2",
          deadline: new Date("2027-01-01"),
        },
      ],
    });
    // ACT - Get tasks as user1
    const response = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${user1.token}`);

    //ASSERT
    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(2);
    expect(
      response.body.tasks.every(
        (task: { userId: number }) => task.userId === user1.user.id,
      ),
    ).toBe(true);
  });
});

/** ---------------- PUT TASK --------------- */

describe("PUT /tasks/:id", () => {
  // ----- Nominal Update -----
  it("Update task of authenticated user - 200", async () => {
    // ARRANGE
    const { user, token } = await createAuthUser(
      "test@test.com",
      "password1234",
    );
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: "Old title",
        deadline: new Date("2027-01-01"),
      },
    });
    // ACT
    const response = await request(app)
      .put(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New title" });
    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.taskUpdated.title).toBe("New title");
  });

  // ----- Update task of another user -----
  it("Refuse task modification of another user - 404", async () => {
    // ARRANGE
    const user1 = await createAuthUser("user1@test.com", "pass1234");
    const user2 = await createAuthUser("user2@test.com", "pass1234");

    const taskOfUser2 = await prisma.task.create({
      data: {
        userId: user2.user.id,
        title: "task user2",
        deadline: new Date("2027-01-01"),
      },
    });
    // ACT - user1 tries to update user2's task
    const response = await request(app)
      .put(`/tasks/${taskOfUser2.id}`)
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ title: "Wrong User" });
    // ASSERT
    expect(response.status).toBe(404);
    // check if task has been not modified
    const taskInDb = await prisma.task.findUnique({
      where: { id: taskOfUser2.id },
    });
    expect(taskInDb?.title).toBe("task user2"); // Title not modified
  });
});

/** ------------------- DELETE TASKS ----------------- */
describe("DELETE /tasks/:id", () => {
  // ----- Nominal Remove Task -----
  it("Remove a task of authenticated user - 204", async () => {
    // ARRANGE
    const { user, token } = await createAuthUser(
      "test@test.com",
      "password1234",
    );
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: "To delete",
        deadline: new Date("2027-01-01"),
      },
    });
    // ACT
    const response = await request(app)
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`);
    // ASSERT - HTTP
    expect(response.status).toBe(204);
    // ASSERT - DB : task no longer exists
    const taskInDb = await prisma.task.findUnique({ where: { id: task.id } });
    expect(taskInDb).toBeNull();
  });

  // ----- Remove a task of another user -----
  it("Refuse to remove another user's task - 404", async () => {
    // ARRANGE
    const user1 = await createAuthUser("user1@test.com", "password1234");
    const user2 = await createAuthUser("user2@test.com", "password1234");
    const taskOfUser2 = await prisma.task.create({
      data: {
        userId: user2.user.id,
        title: "task user2",
        deadline: new Date("2027-01-01"),
      },
    });

    // ACT
    const response = await request(app)
      .delete(`/tasks/${taskOfUser2.id}`)
      .set("Authorization", `Bearer ${user1.token}`);

    // ASSERT - HTTP
    expect(response.status).toBe(404);
    // ASSERT - DB
    const taskInDb = await prisma.task.findUnique({
      where: { id: taskOfUser2.id },
    });
    expect(taskInDb).not.toBeNull();
  });
});
