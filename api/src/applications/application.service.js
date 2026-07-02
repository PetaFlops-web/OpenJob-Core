import i18next from "i18next";
import applicationRepositry from "./application.repository.js";

import {
  InvariantError,
  NotFoundError,
  AuthError,
  ForbiddenError,
} from "../exceptions/index.js";
import { sendMessage } from "../export/producer.js";
import { getIO } from "../ws/websocket.js";
import { createRealtimePayload } from "../ws/realtime-event.js";
import logger from "../utils/logger.js";

const addNewApplication = async (payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  if (payload.document_id) {
    const { default: documentsRepository } = await import("../documents/documents.repository.js");
    const doc = await documentsRepository.getDocumentById(payload.document_id, user.id);
    if (!doc) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));

    const { default: atsRepository } = await import("../ats/ats.repository.js");
    const analysis = await atsRepository.getCvAnalysisByDocumentId(payload.document_id);
    if (analysis && typeof analysis.ats_score === "number") {
      payload.ats_score = analysis.ats_score;
    }
  }

  const duplicate = await applicationRepositry.checkDuplicateApplication(
    payload.job_id,
    user.id,
  );
  if (duplicate) throw new InvariantError(i18next.t("error.alreadyApplied"));
  const result = await applicationRepositry.addNewApplication(payload);
  if (!result) throw new InvariantError(i18next.t("error.failedToCreate", { resource: i18next.t("resource.application") }));

  await sendMessage("application_created", {
    application_id: result.id,
  });

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${user.id}`).emit("application_update", createRealtimePayload({
      id: result.id,
      type: "application_update",
      message: "Application submitted",
      application_id: result.id,
      status: result.status,
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return result;
};

const getAllApplications = async (userId, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await applicationRepositry.getApplicationByUserId(userId);

  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));
  return result;
};

const getApplicationById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await applicationRepositry.getApplicationById(id);

  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));
  return result;
};

const getApplicationByUserId = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await applicationRepositry.getApplicationByUserId(id);

  return result;
};

const getApplicationByJobId = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  
  const result = await applicationRepositry.getApplicationByJobId(id);
  
  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));

  return result;
};

const getApplicationDocument = async (applicationId, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const application = await applicationRepositry.getApplicationById(applicationId);
  if (!application) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));
  if (!application.document_id) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));

  // Check access: applicant or recruiter who owns the company posting the job
  if (application.user_id !== user.id) {
    const { default: jobsRepository } = await import("../jobs/jobs.repository.js");
    const job = await jobsRepository.getJobById(application.job_id);
    if (!job) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));

    const { default: companiesRepository } = await import("../companies/companies.repository.js");
    const company = await companiesRepository.getCompanyById(job.company_id);
    if (!company || company.user_id !== user.id) {
      throw new ForbiddenError(i18next.t("error.unauthorized"));
    }
  }

  const { default: documentsRepository } = await import("../documents/documents.repository.js");
  const document = await documentsRepository.getDocumentById(application.document_id, null);
  if (!document) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));

  return document;
};

const ensureRecruiterOwnsApplicationJob = async (application, user) => {
  if (user.role !== "recruiter") {
    throw new ForbiddenError(i18next.t("error.unauthorized"));
  }

  const { default: jobsRepository } = await import("../jobs/jobs.repository.js");
  const job = await jobsRepository.getJobById(application.job_id);
  if (!job) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));

  const { default: companiesRepository } = await import("../companies/companies.repository.js");
  const company = await companiesRepository.getCompanyById(job.company_id);
  if (!company || company.user_id !== user.id) {
    throw new ForbiddenError(i18next.t("error.unauthorized"));
  }
};

const patchApplicationStatus = async (id, payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const existingApplication = await applicationRepositry.getApplicationById(id);
  if (!existingApplication) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));

  await ensureRecruiterOwnsApplicationJob(existingApplication, user);
  await applicationRepositry.updateApplicationById(id, { status: payload.status });

  try {
    const io = getIO();
    io.to(`user:${existingApplication.user_id}`).emit("application_update", createRealtimePayload({
      id,
      type: "application_update",
      message: `Application status updated to ${payload.status}`,
      application_id: id,
      status: payload.status,
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return { id, status: payload.status, job_id: existingApplication.job_id, user_id: existingApplication.user_id };
};

const updateApplicationById = async (id, payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const existingApplication = await applicationRepositry.getApplicationById(id);

  if (!existingApplication) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));
  
  if (existingApplication.user_id !== user.id) {
    throw new ForbiddenError(i18next.t("error.unauthorized"));
  }

  const result = await applicationRepositry.updateApplicationById(
    id,
    payload,
  );

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${existingApplication.user_id}`).emit("application_update", createRealtimePayload({
      id,
      type: "application_update",
      message: `Application status updated to ${payload.status}`,
      application_id: id,
      status: payload.status,
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return result;
};

const deleteApplicationById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const existingApplication = await applicationRepositry.getApplicationById(id);

  if (!existingApplication) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") }));
  
  if (existingApplication.user_id !== user.id) {
    throw new ForbiddenError(i18next.t("error.unauthorized"));
  }

  const result = await applicationRepositry.deleteApplicationById(id);

  return result;
};

export {
  addNewApplication,
  getAllApplications,
  getApplicationById,
  getApplicationByUserId,
  getApplicationByJobId,
  getApplicationDocument,
  patchApplicationStatus,
  updateApplicationById,
  deleteApplicationById,
};