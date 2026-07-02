import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
} from "./developer.service.js";
import response from "../utils/response.js";

const generateApiKeyHandler = async (req, res, next) => {
  try {
    const { company_id: companyId, name, permissions } = req.validate;
    const user = req.user;

    const result = await generateApiKey(companyId, name, permissions, user);

    return response(res, 201, req.t("success.created", { resource: req.t("resource.apiKey") }), result);
  } catch (error) {
    next(error);
  }
};

const listApiKeysHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const companyId = req.query.company_id;

    if (!companyId) {
      return response(res, 400, req.t("error.missingQueryParameter", { parameter: "company_id" }), null);
    }

    const keys = await listApiKeys(companyId, user);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.apiKey") }), keys);
  } catch (error) {
    next(error);
  }
};

const revokeApiKeyHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const companyId = req.body.company_id;

    await revokeApiKey(id, companyId, user);

    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.apiKey") }), null);
  } catch (error) {
    next(error);
  }
};

const rotateApiKeyHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const companyId = req.body.company_id;

    const result = await rotateApiKey(id, companyId, user);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.apiKey") }), result);
  } catch (error) {
    next(error);
  }
};

export {
  generateApiKeyHandler,
  listApiKeysHandler,
  revokeApiKeyHandler,
  rotateApiKeyHandler,
};
