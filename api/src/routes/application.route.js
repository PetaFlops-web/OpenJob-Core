import {
  addNewApplicationHandler,
  getAllApplicationHandler,
  getApplicationByIdHandler,
  getAllApplicationByUserIdHandler,
  getAllApplicationByJobIdHandler,
  putApplicationByIdHandler,
  patchApplicationStatusHandler,
  deleteApplicationHandler,
  getApplicationDocumentHandler,
} from "../applications/application.controller.js";
import {
  applicationSchema,
  updateApplicationSchema,
  patchApplicationStatusSchema,
} from "../applications/application.schema.js";
import authenticateToken from "../middlewares/authentication.js";
import validate from "../middlewares/validate.js";
import { Router } from "express";

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job applications — submit and manage
 */
const routerApplication = Router();

/**
 * @swagger
 * /applications:
 *   post:
 *     tags: [Applications]
 *     summary: Submit a job application
 *     security:
 *       - BearerAuth: []
 */
routerApplication.post(
  "/",
  authenticateToken,
  validate(applicationSchema),
  addNewApplicationHandler,
);

/**
 * @swagger
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get all applications
 *     security:
 *       - BearerAuth: []
 */
routerApplication.get("/", authenticateToken, getAllApplicationHandler);

/**
 * @swagger
 * /applications/{applicationId}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     security:
 *       - BearerAuth: []
 */
routerApplication.get(
  "/:applicationId",
  authenticateToken,
  getApplicationByIdHandler,
);

/**
 * @swagger
 * /applications/{applicationId}/document:
 *   get:
 *     tags: [Applications]
 *     summary: Download CV document attached to an application
 *     security:
 *       - BearerAuth: []
 */
routerApplication.get(
  "/:applicationId/document",
  authenticateToken,
  getApplicationDocumentHandler,
);

/**
 * @swagger
 * /applications/user/{userId}:
 *   get:
 *     tags: [Applications]
 *     summary: Get applications by user
 *     security:
 *       - BearerAuth: []
 */
routerApplication.get(
  "/user/:userId",
  authenticateToken,
  getAllApplicationByUserIdHandler,
);

/**
 * @swagger
 * /applications/job/{jobId}:
 *   get:
 *     tags: [Applications]
 *     summary: Get applications by job
 *     security:
 *       - BearerAuth: []
 */
routerApplication.get(
  "/job/:jobId",
  authenticateToken,
  getAllApplicationByJobIdHandler,
);

/**
 * @swagger
 * /applications/{applicationId}:
 *   put:
 *     tags: [Applications]
 *     summary: Update application status
 *     security:
 *       - BearerAuth: []
 */
routerApplication.put(
  "/:applicationId",
  authenticateToken,
  validate(updateApplicationSchema),
  putApplicationByIdHandler,
);

routerApplication.patch(
  "/:applicationId",
  authenticateToken,
  validate(patchApplicationStatusSchema),
  patchApplicationStatusHandler,
);

/**
 * @swagger
 * /applications/{applicationId}:
 *   delete:
 *     tags: [Applications]
 *     summary: Delete an application
 *     security:
 *       - BearerAuth: []
 */
routerApplication.delete(
  "/:applicationId",
  authenticateToken,
  deleteApplicationHandler,
);

export default routerApplication;