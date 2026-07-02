import {
  addCategoryhandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  getAllCategoryHandler,
  getCategoryByIdHandler,
} from "../categories/categories.controller.js";
import { Router } from "express";
import { categorySchema } from "../categories/categories.schema.js";
import validate from "../middlewares/validate.js";
import authenticateToken from "../middlewares/authentication.js";

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Job categories — CRUD operations
 */
const routerCategories = Router();

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     description: Create a job category. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCategories.post(
  "/",
  authenticateToken,
  validate(categorySchema),
  addCategoryhandler,
);

/**
 * @swagger
 * /categories/{categoryId}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     description: Update an existing job category by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCategories.put(
  "/:categoryId",
  authenticateToken,
  validate(categorySchema),
  updateCategoryHandler,
);

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     description: Retrieve a list of all job categories. Public endpoint.
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCategories.get("/", getAllCategoryHandler);

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     description: Retrieve a single category by its ID.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCategories.get("/:categoryId", getCategoryByIdHandler);

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     description: Delete a job category by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCategories.delete(
  "/:categoryId",
  authenticateToken,
  deleteCategoryHandler,
);

export default routerCategories;
