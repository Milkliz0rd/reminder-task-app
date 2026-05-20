import { Router } from "express";
import {
  createCategory,
  getAllCategory,
  updateCategory,
  removeCategory,
} from "../controllers/categoryController";
import { authentificateToken } from "../middleware/auth";

const router = Router();

router.get("/", authentificateToken, getAllCategory);
router.post("/", authentificateToken, createCategory);
router.put("/:id", authentificateToken, updateCategory);
router.delete("/:id", authentificateToken, removeCategory);
export default router;
