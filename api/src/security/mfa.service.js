import i18next from "i18next";
import speakeasy from "speakeasy";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { InvariantError } from "../exceptions/index.js";
import MFARepository from "./mfa.repository.js";
import TokenManager from "./token-manager.js";
import userRepository from "../users/user.repository.js";
import CacheService from "../cache/redis.service.js";

const setupMFA = async (userId) => {
  const secret = speakeasy.generateSecret({
    name: `OpenJob:${userId}`,
  });

  await MFARepository.upsertMFASettings(userId, {
    secret: secret.base32,
    enabled: false,
    backup_codes: null,
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
};
const verifyMFA = async (userId, token, mfaToken = null) => {
  if (mfaToken) {
    const mfaPayload = TokenManager.verifyMFAToken(mfaToken);
    if (mfaPayload.id !== userId || mfaPayload.purpose !== "mfa_verify") {
      throw new InvariantError(i18next.t("error.invalidToken"));
    }
  }

  const settings = await MFARepository.getMFASettings(userId);
  if (!settings) throw new InvariantError(i18next.t("error.mfaNotSetUp"));

  // Try TOTP first
  let verified = speakeasy.totp.verify({
    secret: settings.secret,
    encoding: "base32",
    token,
    window: 1,
  });

  // Fallback to backup codes if TOTP fails
  if (!verified && settings.backup_codes?.length) {
    for (const hashed of settings.backup_codes) {
      const match = await bcrypt.compare(token, hashed);
      if (match) {
        verified = true;
        break;
      }
    }
  }

  if (!verified) throw new InvariantError(i18next.t("error.invalidToken"));

  // If this is a login MFA verify, persist MFA enabled
  if (!settings.enabled) {
    await MFARepository.upsertMFASettings(userId, {
      secret: settings.secret,
      enabled: true,
      backup_codes: settings.backup_codes,
    });
    await userRepository.updateMfaEnabled(userId, true);
    const cache = new CacheService();
    await cache.delete(`profile-${userId}`);
  }

  // Generate final JWT tokens
  const user = await userRepository.getUserById(userId);
  const accessToken = TokenManager.generateAccessToken({ id: userId, role: user.role });
  const refreshToken = TokenManager.generateRefreshToken({ id: userId });

  return { accessToken, refreshToken };
};
const disableMFA = async (userId) => {
  await MFARepository.disableMFA(userId);
  await userRepository.updateMfaEnabled(userId, false);
  const cache = new CacheService();
  await cache.delete(`profile-${userId}`);
};

const generateBackupCodes = async (userId) => {
  const codes = [];
  const hashedCodes = [];

  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
    const hashed = await bcrypt.hash(code, 10);
    hashedCodes.push(hashed);
  }

  await MFARepository.upsertMFASettings(userId, {
    secret: null,
    enabled: true,
    backup_codes: hashedCodes,
  });

  return codes;
};

export { setupMFA, verifyMFA, disableMFA, generateBackupCodes };
