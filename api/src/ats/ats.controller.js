import { scanCvDocument, getUserCvAnalyses } from "./ats.service.js";
import response from "../utils/response.js";

const scanCvHandler = async (req, res) => {
  try {
    const { documentId, skills, jobSummary } = req.validate;
    const user = req.user;

    const result = await scanCvDocument(documentId, user.id, { skills, jobSummary });

    return response(res, 200, req.t("success.created", { resource: req.t("resource.cvAnalysis") }), result);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    if (error.name === "InvariantError")
      return response(res, 400, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getCvAnalysesHandler = async (req, res) => {
  try {
    const user = req.user;
    const analyses = await getUserCvAnalyses(user.id);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.cvAnalysis") }), { analyses });
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export { scanCvHandler, getCvAnalysesHandler };
