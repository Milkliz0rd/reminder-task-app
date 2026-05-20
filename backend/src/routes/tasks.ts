import { Router } from "express";
import {
  createTask,
  getAllTasks,
  updateTask,
  removeTask,
} from "../controllers/taskController";
import { authentificateToken } from "../middleware/auth";

const router = Router();

router.get("/", authentificateToken, getAllTasks);
router.post("/", authentificateToken, createTask);
router.put("/:id", authentificateToken, updateTask);
router.delete("/:id", authentificateToken, removeTask);
export default router;
