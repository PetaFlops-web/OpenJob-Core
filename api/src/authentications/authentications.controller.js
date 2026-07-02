import {
  addAuthentication,
  refreshTokenAuth,
  deleteRefreshToken,
} from "./authentications.service.js";
import response from "../utils/response.js";

const addAuthenticationHandler = async (req, res, next) => {
  const { email, password } = req.validate;

  try {
    const result = await addAuthentication({ email, password });

    if (result.mfa_required) {
      return response(res, 200, req.t("success.login"), {
        mfa_required: true,
        mfa_token: result.mfa_token,
      });
    }

    return response(res, 200, req.t("success.login"), {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  const { refreshToken } = req.validate;

  try {
    const token = await refreshTokenAuth(refreshToken);
    return response(res, 200, req.t("success.tokenRefreshed"), token);
  } catch (error) {
    next(error);
  }
};

const deleteRefreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.validate;
    const result = await deleteRefreshToken(refreshToken);
    return response(res, 200, req.t("success.refreshTokenDeleted"), result);
  } catch (error) {
    next(error);
  }
};

export {
  addAuthenticationHandler,
  refreshTokenHandler,
  deleteRefreshTokenHandler,
};
