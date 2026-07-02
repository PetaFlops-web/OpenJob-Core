import authenticateToken from "../middlewares/authentication.js";
import authenticateTokenOrMfa from "../middlewares/authenticate-token-or-mfa.js";
import validate from "../middlewares/validate.js";
import { setupMFAHandler, verifyMFAHandler, disableMFAHandler, generateBackupCodesHandler } from "../security/mfa.controller.js";
import { getSessionsHandler, revokeSessionHandler, revokeOtherSessionsHandler } from "../security/session.controller.js";
import { verifyMFASchema } from "../security/mfa.schema.js";
import { Router } from "express";

const routerAuth = Router();

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     tags: [Auth]
 *     summary: Setup MFA
 *     description: Generate a new MFA secret and QR code URL for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup initiated
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
 *                         secret:
 *                           type: string
 *                         otpauth_url:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuth.post("/mfa/setup", authenticateToken, setupMFAHandler);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify MFA token
 *     description: Verify a TOTP token and enable MFA for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid token
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuth.post("/mfa/verify", authenticateTokenOrMfa, validate(verifyMFASchema), verifyMFAHandler);

/**
 * @swagger
 * /auth/mfa/disable:
 *   delete:
 *     tags: [Auth]
 *     summary: Disable MFA
 *     description: Disable MFA for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuth.delete("/mfa/disable", authenticateToken, disableMFAHandler);

routerAuth.post("/mfa/backup-codes", authenticateToken, generateBackupCodesHandler);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: Get active sessions
 *     description: Retrieve all active sessions for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           device_info:
 *                             type: object
 *                           ip_address:
 *                             type: string
 *                           location:
 *                             type: string
 *                           is_active:
 *                             type: boolean
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           last_active_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuth.get("/sessions", authenticateToken, getSessionsHandler);


routerAuth.delete("/sessions/others", authenticateToken, revokeOtherSessionsHandler);
/**
 * @swagger
 * /auth/sessions/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke a session
 *     description: Revoke a specific session by ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuth.delete("/sessions/:id", authenticateToken, revokeSessionHandler);

export default routerAuth;
