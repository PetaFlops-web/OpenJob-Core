import i18next from "i18next";

import jwt from "jsonwebtoken";
import InvariantError from "../exceptions/Invariant-Error.js";

const TokenManager = {
  generateAccessToken: (payload) =>
    jwt.sign({ ...payload, typ: "access" }, process.env.ACCESS_TOKEN_KEY, { expiresIn: "24h" }),
  generateRefreshToken: (payload) =>
    jwt.sign({ ...payload, typ: "refresh" }, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" }),

  generateMFAToken: (payload) =>
    jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: "5m" }),

  verifyMFAToken: (mfaToken) => {
    try {
      return jwt.verify(mfaToken, process.env.ACCESS_TOKEN_KEY);
    } catch {
      throw new InvariantError(i18next.t("error.invalidToken"));
    }
  },
  verifyRefreshToken: (refreshToken) => {
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
      return payload;
    } catch {
      throw new InvariantError(i18next.t("error.invalidRefreshToken"));
    }
  },

  verify: (token, key) => {
    try {
      const payload = jwt.verify(token, key);
      return payload;
    } catch {
      throw new InvariantError(i18next.t("error.invalidToken"));
    }
  },
};

export default TokenManager;
