import TokenManager from "../security/token-manager.js";
import response from "../utils/response.js";

async function authenticateTokenOrMfa(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.indexOf("Bearer ") !== -1) {
    try {
      const user = TokenManager.verify(
        authHeader.split("Bearer ")[1],
        process.env.ACCESS_TOKEN_KEY,
      );
      req.user = user;
      return next();
    } catch (_error) {
      // fall through to mfa_token check
    }
  }

  const mfaToken = req.body?.mfa_token;
  if (mfaToken) {
    try {
      const payload = TokenManager.verifyMFAToken(mfaToken);
      if (payload.purpose !== "mfa_verify") {
        return response(res, 401, req.t("error.invalidToken"), null);
      }
      req.user = { id: payload.id };
      return next();
    } catch (_error) {
      return response(res, 401, req.t("error.invalidToken"), null);
    }
  }

  return response(res, 401, req.t("error.unauthorized"), null);
}

export default authenticateTokenOrMfa;
