import i18next from "i18next";
import categoriesRepository from "./categories.repository.js";
import {
  InvariantError,
  AuthError,
  NotFoundError,
} from "../exceptions/index.js";
const addCategory = async (user, payload) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  const idCategory = await categoriesRepository.addNewCategory(payload);
  if (!idCategory) throw new InvariantError(i18next.t("error.failedToCreate", { resource: i18next.t("resource.category") }));
  return idCategory;
};

const updateCategoryById = async (id, payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  const idCategory = await categoriesRepository.updateCategoryById(id, payload);
  if (!idCategory) throw new NotFoundError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.category") }));
  return idCategory;
};

const deleteCategoryById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  const idCategory = await categoriesRepository.deleteCategoryById(id);
  if (!idCategory) throw new NotFoundError(i18next.t("error.failedToDelete", { resource: i18next.t("resource.category") }));
  return idCategory;
};

const getAllCategories = async () => {
  const categories = await categoriesRepository.getAllCategories();
  if (!categories) throw new NotFoundError(i18next.t("error.failedToRetrieve"));
  return categories;
};

const getCategoryById = async (id) => {
  const category = await categoriesRepository.getCategoryById(id);
  if (!category) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.category") }));
  return category;
};

export {
  addCategory,
  updateCategoryById,
  deleteCategoryById,
  getAllCategories,
  getCategoryById,
};
