import { setAvailability, getAvailability, deleteAvailability } from "./availability.service.js";
import response from "../utils/response.js";

const setAvailabilityHandler = async (req, res) => {
  try {
    const payload = req.validate;
    const user = req.user;
    const id = await setAvailability(payload, user);
    return response(res, 201, req.t("success.created", { resource: req.t("resource.availability") }), { id });
  } catch (error) {
    if (error.name === "InvariantError") return response(res, 400, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAvailabilityHandler = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.query.company_id || req.params.companyId;
    const data = await getAvailability(companyId, user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.availability") }), data);
  } catch (error) {
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteAvailabilityHandler = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    await deleteAvailability(id, user);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.availability") }), null);
  } catch (error) {
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export { setAvailabilityHandler, getAvailabilityHandler, deleteAvailabilityHandler };
