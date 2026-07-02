import {
  addCompany,
  putCompanyById,
  deleteCompanyById,
  getAllCompanies,
  getCompanyById,
  uploadLogo,
} from "./companies.service.js";
import response from "../utils/response.js";
import CacheService from "../cache/redis.service.js";

const addCompanyHandler = async (req, res) => {
  try {
    const payload = { ...req.validate, user_id: req.user.id };
    const user = req.user;
    const cache = new CacheService();

    const idCompany = await addCompany(payload, user);
    await cache.delete(`company-${idCompany}`);
    return response(res, 201, req.t("success.created", { resource: req.t("resource.company") }), { id: idCompany });
  } catch (error) {
    if (error.name === "InvariantError")
      return response(res, 400, error.message, null);
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const putCompanyHandler = async (req, res) => {
  try {
    const { companyId: id } = req.params;
    const { validate } = req;
    const user = req.user;

    const idCompany = await putCompanyById(id, validate, user);

    const cache = new CacheService();
    await cache.delete(`company-${id}`);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.company") }), { id: idCompany });
  } catch (error) {
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const uploadCompanyLogoHandler = async (req, res) => {
  try {
    const { companyId } = req.params;
    const file = req.file;
    const user = req.user;

    const result = await uploadLogo(companyId, file, user);

    const cache = new CacheService();
    await cache.delete(`company-${companyId}`);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.company") }), result);
  } catch (error) {
    if (error.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError") return response(res, 404, error.message, null);
    if (error.name === "InvariantError") return response(res, 400, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteCompanyHandler = async (req, res) => {
  try {
    const { companyId: id } = req.params;
    const user = req.user;
    const idCompany = await deleteCompanyById(id, user);

    const cache = new CacheService();
    await cache.delete(`company-${id}`);

    response(res, 200, req.t("success.deleted", { resource: req.t("resource.company") }), { id: idCompany });
  } catch (error) {
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);

    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAllCompanyHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const companies = await getAllCompanies();
    const total = companies.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.company") }), {
      companies: companies.slice(offset, offset + limit),
      pagination: { total, page, limit, totalPages },
    });
  } catch {
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getCompanyByIdHandler = async (req, res) => {
  try {
    const { companyId: id } = req.params;

    const cache = new CacheService();

    const cachedCompany = await cache.get(`company-${id}`);

    if (cachedCompany) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.company") }), JSON.parse(cachedCompany));
    } else {
      res.header("X-Data-Source", "database");
    }

    const company = await getCompanyById(id);
    await cache.set(`company-${id}`, JSON.stringify(company));
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.company") }), company);
  } catch (error) {
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  addCompanyHandler,
  putCompanyHandler,
  uploadCompanyLogoHandler,
  deleteCompanyHandler,
  getAllCompanyHandler,
  getCompanyByIdHandler,
};
