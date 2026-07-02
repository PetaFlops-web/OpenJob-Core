import validate from "../middlewares/validate.js";
import authenticateToken from "../middlewares/authentication.js";
import requireRole from "../middlewares/require-role.js";
import {
  addCompanyHandler,
  putCompanyHandler,
  uploadCompanyLogoHandler,
  deleteCompanyHandler,
  getAllCompanyHandler,
  getCompanyByIdHandler,
} from "../companies/companies.controller.js";
import { addCompanySchema } from "../companies/companies.schema.js";
import logoUpload from "../companies/logo-storage.js";
import { Router } from "express";

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company profiles — CRUD operations
 */
const routerCompany = Router();

/**
 * @swagger
 * /companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     description: Create a new company profile. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       201:
 *         description: Company created successfully
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
 *                           example: company-abc123def456
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCompany.post(
  "/",
  authenticateToken,
  requireRole("recruiter"),
  validate(addCompanySchema),
  addCompanyHandler,
);

/**
 * @swagger
 * /companies/{companyId}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company
 *     description: Update an existing company profile by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCompany.put(
  "/:companyId",
  authenticateToken,
  requireRole("recruiter"),
  validate(addCompanySchema),
  putCompanyHandler,
);

/**
 * @swagger
 * /companies/{companyId}/logo:
 *   post:
 *     tags: [Companies]
 *     summary: Upload company logo
 *     description: Upload a company logo image (JPG, PNG, WEBP, GIF, max 2MB). Requires recruiter ownership.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
routerCompany.post(
  "/:companyId/logo",
  authenticateToken,
  requireRole("recruiter"),
  logoUpload.single("logo"),
  uploadCompanyLogoHandler,
);

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: Get all companies
 *     description: Retrieve a list of all companies. Public endpoint.
 *     responses:
 *       200:
 *         description: List of companies
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
 *                         companies:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Company'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCompany.get("/", getAllCompanyHandler);

/**
 * @swagger
 * /companies/{companyId}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company by ID
 *     description: Retrieve a single company by its ID. Supports Redis caching.
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         headers:
 *           X-Data-Source:
 *             description: Data source indicator (cache or database)
 *             schema:
 *               type: string
 *               enum: [cache, database]
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCompany.get("/:companyId", getCompanyByIdHandler);

/**
 * @swagger
 * /companies/{companyId}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete a company
 *     description: Delete a company by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerCompany.delete("/:companyId", authenticateToken, requireRole("recruiter"), deleteCompanyHandler);

import { setAvailabilityHandler, getAvailabilityHandler, deleteAvailabilityHandler } from "../interviews/availability.controller.js";
import { setAvailabilitySchema } from "../interviews/availability.schema.js";

/**
 * @swagger
 * /companies/availability:
 *   post:
 *     tags: [Companies]
 *     summary: Set availability slot
 *     description: Set available interview time slots for the company.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetAvailabilityRequest'
 *     responses:
 *       201:
 *         description: Availability slot created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
routerCompany.post("/availability", authenticateToken, requireRole("recruiter"), validate(setAvailabilitySchema), setAvailabilityHandler);

/**
 * @swagger
 * /companies/{companyId}/availability:
 *   get:
 *     tags: [Companies]
 *     summary: Get company availability
 *     description: Get all availability slots for a company.
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of availability slots
 *       401:
 *         description: Unauthorized
 */
routerCompany.get("/:companyId/availability", authenticateToken, getAvailabilityHandler);

/**
 * @swagger
 * /companies/availability/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete availability slot
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability slot deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
routerCompany.delete("/availability/:id", authenticateToken, requireRole("recruiter"), deleteAvailabilityHandler);

export default routerCompany;
