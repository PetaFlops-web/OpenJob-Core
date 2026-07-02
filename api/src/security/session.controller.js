import { getSessions, revokeSession, revokeOtherSessions } from "./session.service.js";
import response from "../utils/response.js";

const getSessionsHandler = async (req, res) => {
  try {
    const sessions = await getSessions(req.user.id);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.session") }), { sessions });
  } catch (_error) {
    return response(res, 500, req.t("error.internal"), null);
  }
};

const revokeSessionHandler = async (req, res) => {
  try {
    await revokeSession(req.params.id, req.user.id);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.session") }), null);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return response(res, 404, error.message, null);
    }
    return response(res, 500, req.t("error.internal"), null);
  }
};

const revokeOtherSessionsHandler = async (req, res) => {
  try {
    await revokeOtherSessions(req.user.id, req.headers["x-session-id"]);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.session") }), null);
  } catch (_error) {
    return response(res, 500, req.t("error.internal"), null);
  }
};

export { getSessionsHandler, revokeSessionHandler, revokeOtherSessionsHandler };
