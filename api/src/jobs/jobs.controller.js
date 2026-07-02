import {
  addNewJob,
  updateJobById,
  deleteJobById,
  getAllJobs,
  getJobsByCompany,
  getJobByCategory,
  getJobById,
  searchJobs,
} from "./jobs.service.js";
import response from "../utils/response.js";
import CacheService from "../cache/redis.service.js";

const addJobHandler = async (req, res) => {
  try {
    const {
      company_id,
      category_id,
      title,
      description,
      job_type,
      experience_level,
      location_type,
      location_city,
      salary_min,
      salary_max,
      is_salary_visible,
      status,
      requirements,
      benefits,
    } = req.validate;

    const user = req.user;

    const id = await addNewJob(
      {
        company_id,
        category_id,
        title,
        description,
        job_type,
        experience_level,
        location_type,
        location_city,
        salary_min,
        salary_max,
        is_salary_visible,
        status,
        requirements,
        benefits,
      },
      user,
    );

    const cache = new CacheService();

    await cache.delete(`job-${id}`);

    return response(res, 201, req.t("success.created", { resource: req.t("resource.job") }), { id });
  } catch (err) {

    if (err.name === "InvariantError")

      return response(res, 400, err.message, null);

    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const updateJobByidHandler = async (req, res) => {
  try {

    const { jobId: id } = req.params;
    const {
      company_id,
      category_id,
      title,
      description,
      job_type,
      experience_level,
      location_type,
      location_city,
      salary_min,
      salary_max,
      is_salary_visible,
      status,
      requirements,
      benefits,
    } = req.validate;

    const user = req.user;

    const job = await updateJobById(
      id,
      {
        company_id,
        category_id,
        title,
        description,
        job_type,
        experience_level,
        location_type,
        location_city,
        salary_min,
        salary_max,
        is_salary_visible,
        status,
        requirements,
        benefits,
      },
      user,
    );

    const cache = new CacheService();

    await cache.delete(`job-${id}`);

    return response(res, 200, req.t("success.updated", { resource: req.t("resource.job") }), { id: job });
  } catch (err) {
    if (err.name === "NotFoundError")
      return response(res, 404, err.message, null);
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteJobHandler = async (req, res) => {
  try {
    const { jobId: id } = req.params;

    const user = req.user;

    const job = await deleteJobById(id, user);

    const cache = new CacheService();

    await cache.delete(`job-${id}`);

    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.job") }), { id: job });
  } catch (err) {

    if (err.name === "NotFoundError")

      return response(res, 404, err.message, null);

    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getAllJobHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const jobs = await getAllJobs();
    const total = jobs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), {
      jobs: jobs.slice(offset, offset + limit),
      pagination: { total, page, limit, totalPages },
    });
  } catch {
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getJobByCompanyHandler = async (req, res) => {

  try {

    const { jobCompanyId: id } = req.params;

    const jobs = await getJobsByCompany(id);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), { jobs });

  } catch (err) {

    if (err.name === "NotFoundError")

      return response(res, 404, err.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getJobByCategoryHandler = async (req, res) => {

  try {

    const { jobCategoryId: id } = req.params;

    const jobs = await getJobByCategory(id);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), { jobs });
  } catch (err) {

    if (err.name === "NotFoundError")

      return response(res, 404, err.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getJobByIdHandler = async (req, res) => {
  try {

    const { jobId: id } = req.params;

    const cache = new CacheService();

    const cachedJob = await cache.get(`job-${id}`);

    if (cachedJob) {
      res.header("X-Data-Source", "cache");

      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), JSON.parse(cachedJob));
    }

    const job = await getJobById(id);

    await cache.set(`job-${id}`, JSON.stringify(job));

    res.header("X-Data-Source", "database");

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), job);
  } catch (err) {

    if (err.name === "NotFoundError")

      return response(res, 404, err.message, null);
      
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getSearchJob = async (req, res) => {
  try {
    const { search } = req.validate;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await searchJobs(search, page, limit);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.job") }), result);
  } catch (err) {
    if (err.name === "NotFoundError")
      return response(res, 404, err.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  addJobHandler,
  updateJobByidHandler,
  deleteJobHandler,
  getAllJobHandler,
  getJobByCompanyHandler,
  getJobByCategoryHandler,
  getJobByIdHandler,
  getSearchJob,
};
