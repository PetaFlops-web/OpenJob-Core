import { setupMFA, verifyMFA, disableMFA, generateBackupCodes } from "./mfa.service.js";
import response from "../utils/response.js";

const setupMFAHandler = async (req, res) => {
  try {
    const result = await setupMFA(req.user.id);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.mfa") }), result);
  } catch (_error) {
    return response(res, 500, req.t("error.internal"), null);
  }
};
const verifyMFAHandler = async (req, res) => {
  try {
    const { token, mfa_token } = req.validate;
    const result = await verifyMFA(req.user.id, token, mfa_token || null);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.mfa") }), result);
  } catch (e) {
    if (e.name === "InvariantError")
      return response(res, 400, e.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};
const disableMFAHandler = async (req, res) => {
  try {
    await disableMFA(req.user.id);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.mfa") }), null);
  } catch (_error) {
    return response(res, 500, req.t("error.internal"), null);
  }
};


const generateBackupCodesHandler = async (req, res) => {
  try {
    const codes = await generateBackupCodes(req.user.id);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.mfa") }), { backup_codes: codes });
  } catch (_error) {
    return response(res, 500, req.t("error.internal"), null);
  }
};

export { setupMFAHandler, verifyMFAHandler, disableMFAHandler, generateBackupCodesHandler };
