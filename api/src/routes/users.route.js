import { Router } from "express";
import {
  addUserHandler,
  getUserByIdHandler,
} from "../users/user.controller.js";
import { getSkillsByUserHandler } from "../skills/skills.controller.js";
import { addUserSchema } from "../users/schema-user.js";
import authenticateToken from "../middlewares/authentication.js";
import requireRole from "../middlewares/require-role.js";
import validate from "../middlewares/validate.js";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User registration and management
 */
const router = Router();

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     description: Create a new user account. Public endpoint.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                         id:
 *                           type: string
 *                           example: user-abc123def456
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", validate(addUserSchema), addUserHandler);

router.get("/:id/skills", authenticateToken, requireRole("recruiter"), getSkillsByUserHandler);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve a user by their ID. Public endpoint with Redis caching.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         headers:
 *           X-Data-Source:
 *             description: Data source indicator (cache or database)
 *             schema:
 *               type: string
 *               enum: [cache, database]
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", getUserByIdHandler);

export default router;
