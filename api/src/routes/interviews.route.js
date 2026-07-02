import { Router } from "express";
import authenticateToken from "../middlewares/authentication.js";
import requireRole from "../middlewares/require-role.js";
import validate from "../middlewares/validate.js";
import {
  scheduleInterviewHandler,
  updateInterviewHandler,
  cancelInterviewHandler,
  getInterviewByIdHandler,
  getCompanyInterviewsHandler,
  getUserInterviewsHandler,
  completeInterviewHandler,
  noShowHandler,
} from "../interviews/interviews.controller.js";
import {
  setAvailabilityHandler,
  getAvailabilityHandler,
  deleteAvailabilityHandler,
} from "../interviews/availability.controller.js";
import { setAvailabilitySchema } from "../interviews/availability.schema.js";
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
} from "../interviews/interviews.schema.js";

const routerInterview = Router();

/**
 * @swagger
 * tags:
 *   name: Interviews
 *   description: Interview scheduling between companies and applicants
 */

/**
 * @swagger
 * /interviews:
 *   post:
 *     tags: [Interviews]
 *     summary: Schedule an interview
 *     description: Company schedules an interview for an application.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleInterviewRequest'
 *     responses:
 *       201:
 *         description: Interview scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Schedule conflict
 */
routerInterview.post(
  "/",
  authenticateToken,
  requireRole("recruiter"),
  validate(scheduleInterviewSchema),
  scheduleInterviewHandler,
);

/**
 * @swagger
 * /interviews:
 *   get:
 *     tags: [Interviews]
 *     summary: List interviews (company view)
 *     description: Get all interviews for the authenticated company.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of interviews
 *       401:
 *         description: Unauthorized
 */
routerInterview.get(
  "/",
  authenticateToken,
  requireRole("recruiter"),
  getCompanyInterviewsHandler,
);

/**
 * @swagger
 * /interviews/user:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interviews by user
 *     description: Retrieves all interviews for a specific user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User interviews retrieved successfully
 *       401:
 *         description: Unauthorized
 */
routerInterview.get(
  "/user",
  authenticateToken,
  getUserInterviewsHandler,
);

/**
 * @swagger
 * /interviews/availability:
 *   post:
 *     tags: [Interviews]
 *     summary: Set company availability slot
 *     description: Creates a recurring weekly availability slot for the company.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_id: { type: string }
 *               day_of_week: { type: integer, minimum: 0, maximum: 6 }
 *               start_time: { type: string, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }
 *               end_time: { type: string, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }
 *               is_active: { type: boolean, default: true }
 *             required:
 *               - company_id
 *               - day_of_week
 *               - start_time
 *               - end_time
 *     responses:
 *       201:
 *         description: Availability created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
routerInterview.post(
  "/availability",
  authenticateToken,
  requireRole("recruiter"),
  validate(setAvailabilitySchema),
  setAvailabilityHandler,
);

/**
 * @swagger
 * /interviews/availability:
 *   get:
 *     tags: [Interviews]
 *     summary: Get company availability
 *     description: Returns all availability slots for a company.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of availability slots
 *       401:
 *         description: Unauthorized
 */
routerInterview.get(
  "/availability",
  authenticateToken,
  getAvailabilityHandler,
);

/**
 * @swagger
 * /interviews/availability/{id}:
 *   delete:
 *     tags: [Interviews]
 *     summary: Delete availability slot
 *     description: Removes a specific availability slot by id.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
routerInterview.delete(
  "/availability/:id",
  authenticateToken,
  requireRole("recruiter"),
  deleteAvailabilityHandler,
);

/**
 * @swagger
 * /interviews/{id}:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interview detail
 *     description: Get detailed information about a specific interview.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Interview details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview not found
 */
routerInterview.get(
  "/:id",
  authenticateToken,
  getInterviewByIdHandler,
);

/**
 * @swagger
 * /interviews/{id}:
 *   put:
 *     tags: [Interviews]
 *     summary: Reschedule or update interview
 *     description: Update interview schedule, location, or other details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInterviewRequest'
 *     responses:
 *       200:
 *         description: Interview updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview not found
 */
routerInterview.put(
  "/:id",
  authenticateToken,
  requireRole("recruiter"),
  validate(updateInterviewSchema),
  updateInterviewHandler,
);

/**
 * @swagger
 * /interviews/{id}:
 *   delete:
 *     tags: [Interviews]
 *     summary: Cancel interview
 *     description: Cancel a scheduled interview.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Interview cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview not found
 */
routerInterview.delete(
  "/:id",
  authenticateToken,
  requireRole("recruiter"),
  cancelInterviewHandler,
);

/**
 * @swagger
 * /interviews/{id}/complete:
 *   put:
 *     tags: [Interviews]
 *     summary: Mark interview as completed
 *     description: Mark an interview as completed after it has taken place.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Interview completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview not found
 */
routerInterview.put(
  "/:id/complete",
  authenticateToken,
  requireRole("recruiter"),
  completeInterviewHandler,
);

/**
 * @swagger
 * /interviews/{id}/no-show:
 *   put:
 *     tags: [Interviews]
 *     summary: Mark applicant as no-show
 *     description: Mark that the applicant did not attend the interview.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Interview marked as no-show
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview not found
 */
routerInterview.put(
  "/:id/no-show",
  authenticateToken,
  requireRole("recruiter"),
  noShowHandler,
);

export default routerInterview;
