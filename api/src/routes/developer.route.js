import {
  generateApiKeyHandler,
  listApiKeysHandler,
  revokeApiKeyHandler,
  rotateApiKeyHandler,
} from "../developer/developer.controller.js";
import { createApiKeySchema } from "../developer/developer.schema.js";
import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";

/**
 * @swagger
 * tags:
 *   name: Developer
 *   description: API key management for developers
 */
const routerDeveloper = Router();

/**
 * @swagger
 * /developer/keys:
 *   post:
 *     tags: [Developer]
 *     summary: Generate a new API key
 *     description: Creates a new API key for a company. Returns the full key once.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - name
 *             properties:
 *               company_id:
 *                 type: string
 *                 description: Company ID to associate the key with
 *               name:
 *                 type: string
 *                 description: Human-readable name for the key
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional permission scopes
 *     responses:
 *       201:
 *         description: API key generated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerDeveloper.post(
  "/keys",
  authenticateToken,
  validate(createApiKeySchema),
  generateApiKeyHandler,
);

/**
 * @swagger
 * /developer/keys:
 *   get:
 *     tags: [Developer]
 *     summary: List API keys
 *     description: Retrieves all API keys for a company. Requires Bearer token or API key authentication.
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Unauthorized
 */
routerDeveloper.get(
  "/keys",
  authenticateToken,
  listApiKeysHandler,
);

/**
 * @swagger
 * /developer/keys/{id}:
 *   delete:
 *     tags: [Developer]
 *     summary: Revoke an API key
 *     description: Revokes an API key. Requires Bearer token or API key authentication.
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *             properties:
 *               company_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key revoked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
routerDeveloper.delete(
  "/keys/:id",
  authenticateToken,
  revokeApiKeyHandler,
);

/**
 * @swagger
 * /developer/keys/{id}/rotate:
 *   put:
 *     tags: [Developer]
 *     summary: Rotate an API key
 *     description: Generates a new API key and revokes the old one. Requires Bearer token or API key authentication.
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *             properties:
 *               company_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key rotated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
routerDeveloper.put(
  "/keys/:id/rotate",
  authenticateToken,
  rotateApiKeyHandler,
);




export default routerDeveloper;
