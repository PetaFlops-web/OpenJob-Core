import requireRole from "../middlewares/require-role.js";
import {
  addJobHandler,
  updateJobByidHandler,
  deleteJobHandler,
  getAllJobHandler,
  getJobByCompanyHandler,
  getJobByCategoryHandler,
  getJobByIdHandler,
  getSearchJob,
} from "../jobs/jobs.controller.js";
import {
  addNewBookmarkHandler,
  getBookmarkByIdHandler,
  deleteBookmarkHandler,
} from "../bookmarks/bookmarks.controller.js";
import { jobSchema, updateJobSchema, searchJobSchema } from "../jobs/jobs.schema.js";
import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job postings — create, search, filter
 */
const routerJobs = Router();

/**
 * @swagger
 * /jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job posting
 *     description: Post a new job listing. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerJobs.post("/", authenticateToken, requireRole("recruiter"), validate(jobSchema), addJobHandler);

/**
 * @swagger
 * /jobs/{jobId}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update a job posting
 *     description: Update an existing job listing. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerJobs.put(
  "/:jobId",
  authenticateToken,
  requireRole("recruiter"),
  validate(updateJobSchema),
  updateJobByidHandler,
);

/**
 * @swagger
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get all job listings
 *     description: Retrieve all job postings. Public endpoint.
 *     security: []
 *     responses:
 *       200:
 *         description: List of job listings
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
 *                         jobs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Job'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /jobs/search:
 *   post:
 *     tags: [Jobs]
 *     summary: Search jobs by keyword
 *     description: Full-text search across job title, description, type, experience level, and location.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Results per page (max 100)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 example: "software engineer"
 *             required:
 *               - search
 *     responses:
 *       200:
 *         description: Matching jobs found
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerJobs.post("/search", validate(searchJobSchema), getSearchJob);
routerJobs.get("/", getAllJobHandler);

/**
 * @swagger
 * /jobs/company/{jobCompanyId}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get jobs by company
 *     description: Retrieve all job postings for a specific company.
 *     security: []
 */
routerJobs.get("/company/:jobCompanyId", getJobByCompanyHandler);

/**
 * @swagger
 * /jobs/category/{jobCategoryId}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get jobs by category
 *     description: Retrieve all job postings for a specific category.
 *     security: []
 */
routerJobs.get("/category/:jobCategoryId", getJobByCategoryHandler);

/**
 * @swagger
 * /jobs/{jobId}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get job by ID
 *     description: Retrieve a single job posting by ID. Supports Redis caching.
 *     security: []
 */
routerJobs.get("/:jobId", getJobByIdHandler);

/**
 * @swagger
 * /jobs/{jobId}/bookmark:
 *   post:
 *     tags: [Jobs]
 *     summary: Bookmark a job
 *     description: Save a job to user's bookmarks. Requires authentication.
 *     security:
 *       - BearerAuth: []
 */
routerJobs.post("/:jobId/bookmark", authenticateToken, addNewBookmarkHandler);

/**
 * @swagger
 * /jobs/{jobId}/bookmark/{bookmarkId}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get bookmark by ID
 *     description: Retrieve a specific bookmark. Requires authentication.
 *     security:
 *       - BearerAuth: []
 */
routerJobs.get(
  "/:jobId/bookmark/:bookmarkId",
  authenticateToken,
  getBookmarkByIdHandler,
);
/**
 * @swagger
 * /jobs/{jobId}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job posting
 *     description: Delete a job listing by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerJobs.delete("/:jobId", authenticateToken, requireRole("recruiter"), deleteJobHandler);

/**
 * @swagger
 * /jobs/{jobId}/bookmark:
 *   delete:
 *     tags: [Jobs]
 *     summary: Remove bookmark from job
 *     description: Remove a bookmark from a job. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to unbookmark
 *     responses:
 *       200:
 *         description: Bookmark removed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerJobs.delete("/:jobId/bookmark", authenticateToken, deleteBookmarkHandler);

export default routerJobs;
