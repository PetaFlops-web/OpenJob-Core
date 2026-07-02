import TokenManager from "../security/token-manager.js";
import response from "../utils/response.js";

async function authenticateToken(req, res, next) {
  const token = req.headers.authorization;
  if (token && token.indexOf("Bearer ") !== -1) {
    try {
      const user = TokenManager.verify(
        token.split("Bearer ")[1],
        process.env.ACCESS_TOKEN_KEY,
      );
      req.user = user;

      return next();
    } catch (_error) {
      return response(res, 401, req.t("error.unauthorized"), null);
    }
  }

  return response(res, 401, req.t("error.unauthorized"), null);
}

export default authenticateToken;
