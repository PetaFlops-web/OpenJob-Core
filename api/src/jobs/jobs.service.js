import i18next from "i18next";
import jobsRepository from "./jobs.repository.js";
import {
  InvariantError,
  NotFoundError,
  AuthError,
} from "../exceptions/index.js";

const addNewJob = async (payload, user) => {

  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const id = await jobsRepository.addNewJob(payload);

  if (!id) throw new InvariantError(i18next.t("error.failedToCreate", { resource: i18next.t("resource.job") }));

  return id;
};

const updateJobById = async (id, payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const existingJob = await jobsRepository.getJobById(id)
  
  if (!existingJob) {
    throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));
  }

  const idJob = await jobsRepository.updateJobById(id, payload);

  
  if (!idJob) throw new NotFoundError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.job") }));

  return idJob;
};

const deleteJobById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const existingJob = await jobsRepository.getJobById(id)
  if (!existingJob) {
    throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));
  }

  const idJob = await jobsRepository.deleteJobById(id);

  if (!idJob) throw new NotFoundError(i18next.t("error.failedToDelete", { resource: i18next.t("resource.job") }));

  return idJob;
};

const getAllJobs = async () => {
  const jobs = await jobsRepository.getAllJobs();

  if (!jobs) throw new NotFoundError(i18next.t("error.failedToRetrieve"));

  return jobs;
};

const getJobsByCompany = async (id) => {
  const jobs = await jobsRepository.getJobsByCompany(id);

  if (!jobs) throw new NotFoundError(i18next.t("error.failedToRetrieve"));

  return jobs;
};

const getJobByCategory = async (id) => {
  const jobs = await jobsRepository.getJobByCategory(id);

  if (!jobs) throw new NotFoundError(i18next.t("error.failedToRetrieve"));

  return jobs;
};

const getJobById = async (id) => {
  const jobs = await jobsRepository.getJobById(id);

  if (!jobs) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }));
  
  return jobs;
};

const searchJobs = async (search, page = 1, limit = 10) => {

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;


  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;

  const offset = (safePage - 1) * safeLimit;

  const { rows, total } = await jobsRepository.searchJobs(search, safeLimit, offset);

  if (!rows) throw new NotFoundError(i18next.t("error.failedToRetrieve"));

  return {
    jobs: rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export {
  addNewJob,
  updateJobById,
  deleteJobById,
  getAllJobs,
  getJobsByCompany,
  getJobByCategory,
  getJobById,
  searchJobs,
};
