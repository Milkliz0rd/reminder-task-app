import {
  createCategory as createCategoryInDb,
  getAllCategory as getAllCategoryInDb,
  updateCategory as updateCategoryInDb,
  removeCategory as removeCategoryInDb,
} from "../db/categoryQueries";

type CreateCategoryData = {
  name: string
}
type UpdateCategoryData = Partial<CreateCategoryData> // {name?: string}

export async function getAllCategory(userId:number) {
  return getAllCategoryInDb(userId)
}

export async function createCategory(userId: number, data: CreateCategoryData) {
  return createCategoryInDb(userId, data)
}

export async function updateCategory(categoryId:number, userId: number, data: UpdateCategoryData) {
  return updateCategoryInDb(userId, categoryId, data)
}

export async function removeCategory( categoryId:number, userId: number) {
  return removeCategoryInDb(categoryId, userId)
}