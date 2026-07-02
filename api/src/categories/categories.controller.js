import {
  addCategory,
  updateCategoryById,
  deleteCategoryById,
  getAllCategories,
  getCategoryById,
} from "./categories.service.js";

import response from "../utils/response.js";

const addCategoryhandler = async (req, res, next) => {
  try {
    const { name } = req.validate;
    const user = req.user;

    const category = await addCategory(user, { name });

    return response(res, 201, req.t("success.created", { resource: req.t("resource.category") }), {
      id: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategoryHandler = async (req, res, next) => {
  try {
    const { categoryId: id } = req.params;
    const { name } = req.validate;
    const user = req.user;

    const category = await updateCategoryById(id, { name }, user);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.category") }), { id: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategoryHandler = async (req, res, next) => {
  try {
    const { categoryId: id } = req.params;
    const user = req.user;

    const category = await deleteCategoryById(id, user);

    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.category") }), { id: category });
  } catch (error) {
    next(error);
  }
};

const getAllCategoryHandler = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.category") }), { categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryByIdHandler = async (req, res, next) => {
  try {
    const { categoryId: id } = req.params;
    const category = await getCategoryById(id);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.category") }), category);
  } catch (error) {
    next(error);
  }
};

export {
  addCategoryhandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  getAllCategoryHandler,
  getCategoryByIdHandler,
};
