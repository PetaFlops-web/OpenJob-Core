import {
  getCountBookmarkHandler,
} from "../bookmarks/bookmarks.controller.js";
import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: Bookmark saved jobs
 */
const routerBookmark = Router();

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     tags: [Bookmarks]
 *     summary: Get bookmark count
 *     description: Get the total bookmark count for the authenticated user. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmark count for the user
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerBookmark.get("/", authenticateToken, getCountBookmarkHandler);
routerBookmark.get("/count", authenticateToken, getCountBookmarkHandler);

export default routerBookmark;
