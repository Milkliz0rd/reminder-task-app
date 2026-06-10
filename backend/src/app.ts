import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoute from "./routes/auth";
import taskRoute from "./routes/tasks";
import categoryRoute from "./routes/categories";

const app = express();

// Middleware are settings here for test & server using
app.use(express.json());

// Middleware to autorize frontend to call with backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

// Use authentification routes
app.use("/auth", authRoute);

// Category router
app.use("/categories", categoryRoute);

// Task router
app.use("/tasks", taskRoute);

export default app;
