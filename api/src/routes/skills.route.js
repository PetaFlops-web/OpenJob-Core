import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";
import requireRole from "../middlewares/require-role.js";
import validate from "../middlewares/validate.js";
import { addSkillSchema, addSkillsBulkSchema } from "../skills/skills.schema.js";
import {
  getSkillsHandler,
  addSkillHandler,
  addSkillsBulkHandler,
  deleteSkillHandler,
  deleteAllSkillsHandler,
} from "../skills/skills.controller.js";

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Jobseeker skills management
 */
const routerSkills = Router();

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Get all skills for the authenticated jobseeker
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 *       401:
 *         description: Unauthorized
 */
routerSkills.get("/", authenticateToken, requireRole("jobseeker"), getSkillsHandler);

/**
 * @swagger
 * /skills:
 *   post:
 *     summary: Add a single skill
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skill created
 *       400:
 *         description: Invalid input or duplicate
 *       401:
 *         description: Unauthorized
 */
routerSkills.post("/", authenticateToken, requireRole("jobseeker"), validate(addSkillSchema), addSkillHandler);

/**
 * @swagger
 * /skills/bulk:
 *   post:
 *     summary: Add multiple skills at once
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [skills]
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Skills processed (added + skipped duplicates)
 *       401:
 *         description: Unauthorized
 */
routerSkills.post("/bulk", authenticateToken, requireRole("jobseeker"), validate(addSkillsBulkSchema), addSkillsBulkHandler);

/**
 * @swagger
 * /skills/{skillId}:
 *   delete:
 *     summary: Delete a specific skill
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill deleted
 *       404:
 *         description: Skill not found
 *       401:
 *         description: Unauthorized
 */
routerSkills.delete("/:skillId", authenticateToken, requireRole("jobseeker"), deleteSkillHandler);

/**
 * @swagger
 * /skills:
 *   delete:
 *     summary: Delete all skills for the authenticated jobseeker
 *     tags: [Skills]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All skills deleted
 *       401:
 *         description: Unauthorized
 */
routerSkills.delete("/", authenticateToken, requireRole("jobseeker"), deleteAllSkillsHandler);

export default routerSkills;
