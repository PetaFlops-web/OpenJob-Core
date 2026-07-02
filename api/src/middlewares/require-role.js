import response from "../utils/response.js";

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return response(res, 401, req.t("error.unauthorized"), null);
  }

  if (!allowedRoles.includes(req.user.role)) {
    return response(res, 403, req.t("error.forbidden"), null);
  }

  return next();
};

export default requireRole;
