import {
  uploadDocumentHandler,
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
} from "../documents/documents.controller.js";
import { uploadDocumentSchema } from "../documents/documents.schema.js";
import upload from "../documents/storage/config-storage.js";
import express from "express";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Upload and manage PDF documents
 */
const routerDocument = express.Router();

/**
 * @swagger
 * /documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document
 *     description: Upload a PDF document (CV/resume). Max 5MB. Requires authentication. Add ?scan=true to auto-analyze CV with ATS ML.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scan
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Set to "true" to auto-scan CV with ATS ML skills extraction
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: PDF file (max 5MB)
 *             required:
 *               - document
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file type or file too large
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerDocument.post(
  "/",
  authenticateToken,
  upload.single("document"),
  validate(uploadDocumentSchema, "file"),
  uploadDocumentHandler,
);

/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Get all documents
 *     description: Retrieve a list of all documents. Public endpoint.
 *     security: []
 *     responses:
 *       200:
 *         description: List of documents
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerDocument.get("/", authenticateToken, getDocumentsHandler);

/**
 * @swagger
 * /documents/{documentId}:
 *   get:
 *     tags: [Documents]
 *     summary: Get document by ID
 *     description: Retrieve a single document by its ID.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerDocument.get("/:documentId", authenticateToken, getDocumentByIdHandler);

/**
 * @swagger
 * /documents/{documentId}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document
 *     description: Delete a document by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerDocument.delete(
  "/:documentId",
  authenticateToken,
  deleteDocumentHandler,
);

export default routerDocument;
