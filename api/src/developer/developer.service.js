import i18next from "i18next";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import DeveloperRepository from "./developer.repository.js";
import { AuthError, NotFoundError } from "../exceptions/index.js";

const generateApiKey = async (companyId, name, permissions, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  // Generate a raw API key: ob_ prefix + random bytes as hex + underscore + nanoid suffix
  const randomBytes = crypto.randomBytes(20).toString("hex");
  const rawKey = `ob_${randomBytes}`;

  // Hash the key for storage
  const keyHash = await bcrypt.hash(rawKey, 10);

  // Store only the stable API key family prefix; the full key is hashed.
  const keyPrefix = "ob";

  const payload = {
    company_id: companyId,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    permissions: permissions || null,
  };

  const id = await DeveloperRepository.createApiKey(payload);

  return {
    id,
    key: rawKey,
    prefix: keyPrefix,
    name,
  };
};

const listApiKeys = async (companyId, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const keys = await DeveloperRepository.getApiKeys(companyId);
  return keys;
};

const revokeApiKey = async (id, companyId, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const keyRecord = await DeveloperRepository.getApiKeyById(id);
  if (!keyRecord) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.apiKey") }));

  const revokedId = await DeveloperRepository.revokeApiKey(id, companyId);
  if (!revokedId) throw new NotFoundError(i18next.t("error.notFoundOrRevoked", { resource: i18next.t("resource.apiKey") }));

  return revokedId;
};

const rotateApiKey = async (id, companyId, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const keyRecord = await DeveloperRepository.getApiKeyById(id);
  if (!keyRecord) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.apiKey") }));

  // Generate a new raw key
  const randomBytes = crypto.randomBytes(20).toString("hex");
  const rawKey = `ob_${randomBytes}`;

  const newKeyHash = await bcrypt.hash(rawKey, 10);
  const newKeyPrefix = "ob";

  const rotatedId = await DeveloperRepository.rotateApiKey(id, companyId, newKeyHash, newKeyPrefix);
  if (!rotatedId) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.apiKey") }));

  return {
    id: rotatedId,
    key: rawKey,
    prefix: newKeyPrefix,
    name: keyRecord.name,
  };
};

export { generateApiKey, listApiKeys, revokeApiKey, rotateApiKey };
