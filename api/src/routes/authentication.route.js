import {
  addAuthenticationHandler,
  refreshTokenHandler,
  deleteRefreshTokenHandler,
} from "../authentications/authentications.controller.js";
import {
  authenticationSchema,
  refreshTokenSchema,
} from "../authentications/authentication.schema.js";
import validate from "../middlewares/validate.js";
import { Router } from "express";

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Login, token refresh, logout
 */
const routerAuthentication = Router();

/**
 * @swagger
 * /authentications:
 *   post:
 *     tags: [Authentication]
 *     summary: Login
 *     description: Authenticate with email and password to receive JWT tokens.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuthentication.post(
  "/",
  validate(authenticationSchema),
  addAuthenticationHandler,
);

/**
 * @swagger
 * /authentications:
 *   put:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                         accessToken:
 *                           type: string
 *       400:
 *         description: Invalid refresh token
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuthentication.put(
  "/",
  validate(refreshTokenSchema),
  refreshTokenHandler,
);

/**
 * @swagger
 * /authentications:
 *   delete:
 *     tags: [Authentication]
 *     summary: Logout
 *     description: Revoke refresh token (logout).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout successful, token revoked
 *       400:
 *         description: Invalid refresh token
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerAuthentication.delete(
  "/",
  validate(refreshTokenSchema),
  deleteRefreshTokenHandler,
);

export default routerAuthentication;
