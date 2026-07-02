import {
  addNewApplication,
  deleteApplicationById,
  getAllApplications,
  getApplicationById,
  getApplicationByJobId,
  getApplicationByUserId,
  getApplicationDocument,
  patchApplicationStatus,
  updateApplicationById,
} from "./application.service.js";
import response from "../utils/response.js";
import path from "path";
import CacheService from "../cache/redis.service.js";

const addNewApplicationHandler = async (req, res) => {
  try {
    const user = req.user;
    const payload = { ...req.validate, user_id: user.id };
    const application = await addNewApplication(payload, user);

    try {
      const { getIO } = await import("../ws/websocket.js");
      const io = getIO();
      const { default: jobsRepository } = await import("../jobs/jobs.repository.js");
      const job = await jobsRepository.getJobById(payload.job_id);
      if (job?.company_id) {
        io.to(`company:${job.company_id}`).emit("new_application", {
          application_id: application.id,
          job_id: payload.job_id,
          job_title: job.title,
          user_id: user.id,
        });
      }
    } catch {
      // WebSocket not available — non-blocking
    }
    const cache = new CacheService();
    await cache.delete(`profile-applications-v2-${user.id}`);
    await cache.delete(`profile-applications-${user.id}`);
    await cache.delete(`applications-user-${user.id}`);
    await cache.delete(`applications-job-${payload.job_id}`);

    return response(res, 201, req.t("success.created", { resource: req.t("resource.application") }), {
      id: application.id,
      user_id: application.user_id,
      job_id: application.job_id,
      status: application.status,
      document_id: application.document_id,
      ats_score: application.ats_score,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (err.name === "InvariantError") return response(res, 400, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAllApplicationHandler = async (req, res) => {
  try {
    const user = req.user;
    const applications = await getAllApplications(user.id, user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
      applications,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getApplicationByIdHandler = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId: id } = req.params;

    const cache = new CacheService();
    const cachedApplication = await cache.get(`application-${id}`);

    if (cachedApplication) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), JSON.parse(cachedApplication));
    }

    const applications = await getApplicationById(id, user);

    await cache.set(`application-${id}`, JSON.stringify(applications));

    res.header("X-Data-Source", "database");

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), applications);
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAllApplicationByUserIdHandler = async (req, res) => {
  try {
    const { userId: id } = req.params;
    const user = req.user;

    const cache = new CacheService();
    const cachedApplications = await cache.get(`applications-user-${id}`);

    if (cachedApplications) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
        applications: JSON.parse(cachedApplications),
      });
    }

    const applications = await getApplicationByUserId(id, user);
    await cache.set(`applications-user-${id}`, JSON.stringify(applications));
    res.header("X-Data-Source", "database");
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
      applications,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAllApplicationByJobIdHandler = async (req, res) => {
  try {
    const { jobId: id } = req.params;
    const user = req.user;

    const cache = new CacheService();
    const cachedApplications = await cache.get(`applications-job-${id}`);

    if (cachedApplications) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
        applications: JSON.parse(cachedApplications),
      });
    }

    const applications = await getApplicationByJobId(id, user);

    await cache.set(`applications-job-${id}`, JSON.stringify(applications));
    res.header("X-Data-Source", "database");

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
      applications,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getApplicationDocumentHandler = async (req, res) => {
  try {
    const { applicationId: id } = req.params;
    const user = req.user;
    const document = await getApplicationDocument(id, user);

    const documentsDirectory = path.resolve(process.cwd(), "src/documents/pdf");
    const filePath = path.resolve(document.file_url);
    const relativePath = path.relative(documentsDirectory, filePath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return response(res, 404, req.t("error.notFound", { resource: req.t("resource.document") }), null);
    }

    const fileName = path.basename(document.file_url);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.sendFile(filePath);
  } catch (error) {
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "ForbiddenError") return response(res, 403, req.t("error.forbidden"), null);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const patchApplicationStatusHandler = async (req, res) => {
  try {
    const { applicationId: id } = req.params;
    const { status } = req.validate;
    const user = req.user;

    const result = await patchApplicationStatus(id, { status }, user);

    const cache = new CacheService();
    await cache.delete(`application-${id}`);
    await cache.delete(`applications-job-${result.job_id}`);
    await cache.delete(`applications-user-${result.user_id}`);
    await cache.delete(`profile-applications-${result.user_id}`);
    await cache.delete(`profile-applications-v2-${result.user_id}`);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.application") }), result);
  } catch (err) {
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (err.name === "ForbiddenError") return response(res, 403, req.t("error.forbidden"), null);
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const putApplicationByIdHandler = async (req, res, next) => {
  try {
    const { applicationId: id } = req.params;
    const { status } = req.validate;
    const user = req.user;
    const application = await getApplicationById(id, user);
    await updateApplicationById(id, { status }, user);

    const cache = new CacheService();
    await cache.delete(`application-${id}`);
    await cache.delete(`profile-applications-${user.id}`);
    await cache.delete(`profile-applications-v2-${user.id}`);
    await cache.delete(`applications-user-${user.id}`);
    await cache.delete(`applications-job-${application.job_id}`);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.application") }), { id });
  } catch (error) {
    next(error);
  }
};

const deleteApplicationHandler = async (req, res, next) => {
  try {
    const { applicationId: id } = req.params;
    const user = req.user;
    const application = await getApplicationById(id, user);
    await deleteApplicationById(id, user);

    const cache = new CacheService();
    await cache.delete(`application-${id}`);
    await cache.delete(`profile-applications-${user.id}`);
    await cache.delete(`profile-applications-v2-${user.id}`);
    await cache.delete(`applications-user-${user.id}`);
    await cache.delete(`applications-job-${application.job_id}`);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.application") }), { id });
  } catch (error) {
    next(error);
  }
};

export {
  addNewApplicationHandler,
  getAllApplicationHandler,
  getApplicationByIdHandler,
  getAllApplicationByUserIdHandler,
  getAllApplicationByJobIdHandler,
  getApplicationDocumentHandler,
  patchApplicationStatusHandler,
  putApplicationByIdHandler,
  deleteApplicationHandler,
};