import {
  scheduleInterview,
  rescheduleInterview,
  cancelInterview,
  getInterviewById,
  getCompanyInterviews,
  getUserInterviews,
  completeInterview,
  markNoShow,
} from "./interviews.service.js";
import response from "../utils/response.js";
import logger from "../utils/logger.js";

const scheduleInterviewHandler = async (req, res) => {
  try {
    const payload = req.validate;
    const user = req.user;
    const id = await scheduleInterview(payload, user);
    return response(res, 201, req.t("success.created", { resource: req.t("resource.interview") }), { id });
  } catch (error) {
    logger.error(error);
    if (error.name === "InvariantError") return response(res, 400, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const updateInterviewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.validate;
    const user = req.user;
    const updatedId = await rescheduleInterview(id, payload, user);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.interview") }), { id: updatedId });
  } catch (error) {
    logger.error(error);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "InvariantError") return response(res, 400, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const cancelInterviewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await cancelInterview(id, user);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.interview") }), null);
  } catch (error) {
    logger.error(error);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getInterviewByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const interview = await getInterviewById(id, user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.interview") }), interview);
  } catch (error) {
    logger.error(error);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getCompanyInterviewsHandler = async (req, res) => {
  try {
    const user = req.user;
    const { company_id } = req.query;
    const interviews = await getCompanyInterviews(company_id, user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.interview") }), { interviews });
  } catch (error) {
    logger.error(error);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getUserInterviewsHandler = async (req, res) => {
  try {
    const user = req.user;
    const userId = req.query.user_id || user.id;
    const interviews = await getUserInterviews(userId, user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.interview") }), { interviews });
  } catch (error) {
    logger.error(error);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const completeInterviewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updatedId = await completeInterview(id, user);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.interview") }), { id: updatedId });
  } catch (error) {
    logger.error(error);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const noShowHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updatedId = await markNoShow(id, user);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.interview") }), { id: updatedId });
  } catch (error) {
    logger.error(error);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  scheduleInterviewHandler,
  updateInterviewHandler,
  cancelInterviewHandler,
  getInterviewByIdHandler,
  getCompanyInterviewsHandler,
  getUserInterviewsHandler,
  completeInterviewHandler,
  noShowHandler,
};
