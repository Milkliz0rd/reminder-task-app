import {
  createCategory as createCategoryInService,
  getAllCategory as getAllCategoryInService,
  updateCategory as updateCategoryInService,
  removeCategory as removeCategoryInService,
} from "../services/categoryService";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

export async function getAllCategory(request: AuthRequest, response: Response) {
  const userId = request.userId;
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    const category = await getAllCategoryInService(userId);
    return response.status(200).json({ category });
  } catch {
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategory(request: AuthRequest, response: Response) {
  const userId = request.userId;
  const categoryData = request.body;
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  if (!categoryData.name) {
    return response.status(400).json({ message: "name is required" });
  }
  try {
    const category = await createCategoryInService(userId, categoryData);
    return response.status(201).json({ category });
  } catch {
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCategory(request: AuthRequest, response: Response) {
  const categoryId = parseInt(request.params.id as string);
  const userId = request.userId;
  const categoryData = request.body;
  if (isNaN(categoryId)) {
    return response.status(404).json({ message: "This category doesn't exist !" });
  }
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    const categoryUpdated = await updateCategoryInService(categoryId, userId, categoryData);
    return response.status(200).json({ categoryUpdated });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return response.status(404).json({ message: "Category not found" });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function removeCategory(request: AuthRequest, response: Response) {
  const categoryId = parseInt(request.params.id as string);
  const userId = request.userId;
  if (isNaN(categoryId)) {
    return response.status(404).json({ message: "This category doesn't exist !" });
  }
  if (!userId) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  try {
    await removeCategoryInService(categoryId, userId);
    return response.status(204).send();
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return response.status(404).json({ message: "Category not found" });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}
