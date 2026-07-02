import { scanCvHandler, getCvAnalysesHandler } from "./ats.controller.js";
import { scanCvSchema } from "./ats.schema.js";
import express from "express";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";

/**
 * @swagger
 * tags:
 *   name: ATS
 *   description: CV scanning and skills extraction via ATS ML service
 */
const routerAts = express.Router();

/**
 * @swagger
 * /ats/scan:
 *   post:
 *     summary: Score a CV document with Flask ATS scoring
 *     tags: [ATS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: The uploaded document ID to score
 *               skills:
 *                 type: string
 *                 description: Optional candidate skills sent to Flask as form field skills
 *               jobSummary:
 *                 type: string
 *                 description: Optional job summary sent to Flask as form field job_summary
 *     responses:
 *       200:
 *         description: CV analysis completed
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
routerAts.post(
  "/scan",
  authenticateToken,
  validate(scanCvSchema),
  scanCvHandler,
);

/**
 * @swagger
 * /ats/analyses:
 *   get:
 *     summary: Get all CV analyses for the authenticated user
 *     tags: [ATS]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CV analyses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
routerAts.get(
  "/analyses",
  authenticateToken,
  getCvAnalysesHandler,
);

export default routerAts;
