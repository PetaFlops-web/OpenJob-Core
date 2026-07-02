import { getProfileUserByIdHandler, getProfileUserApplicationsHandler, getProfileUserBookmarkedJobsHandler, getProfileUserInterviewsHandler, getProfileInterviewByIdHandler, updateProfileHandler, uploadAvatarHandler } from "../profile/profile.controller.js";
import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";
import { updateProfileSchema } from "../users/schema-user.js";
import avatarUpload from "../profile/avatar-storage.js";

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile, applications & bookmarks
 */
const routerProfile = Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get my profile
 *     description: Retrieve the authenticated user's profile. Supports Redis caching.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
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
 *                       $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerProfile.get("/", authenticateToken, getProfileUserByIdHandler);

/**
 * @swagger
 * /profile/applications:
 *   get:
 *     tags: [Profile]
 *     summary: Get my applications
 *     description: Retrieve the authenticated user's application history. Supports Redis caching.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's applications
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerProfile.get("/applications", authenticateToken, getProfileUserApplicationsHandler);

/**
 * @swagger
 * /profile/bookmarks:
 *   get:
 *     tags: [Profile]
 *     summary: Get my bookmarked jobs
 *     description: Retrieve the authenticated user's bookmarked jobs. Supports Redis caching.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarked jobs
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routerProfile.get("/bookmarks", authenticateToken, getProfileUserBookmarkedJobsHandler);

/**
 * @swagger
 * /profile/interviews:
 *   get:
 *     tags: [Profile]
 *     summary: Get my interviews
 *     description: Retrieve the authenticated user's interview schedule.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's interviews
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
routerProfile.get("/interviews", authenticateToken, getProfileUserInterviewsHandler);

/**
 * @swagger
 * /profile/interviews/{interviewId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get interview detail
 *     description: Retrieve a specific interview detail for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Interview detail
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
routerProfile.get("/interviews/:interviewId", authenticateToken, getProfileInterviewByIdHandler);

/**
 * @swagger
 * /profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update my profile
 *     description: Update the authenticated user's profile information.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
routerProfile.put("/", authenticateToken, validate(updateProfileSchema), updateProfileHandler);

/**
 * @swagger
 * /profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Upload avatar image
 *     description: Upload a profile avatar image (JPG, PNG, WEBP, GIF, max 2MB).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                         avatarUrl:
 *                           type: string
 *                         user:
 *                           $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
routerProfile.post("/avatar", authenticateToken, avatarUpload.single("avatar"), uploadAvatarHandler);

export default routerProfile;
