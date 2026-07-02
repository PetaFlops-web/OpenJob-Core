import bookmarksRepository from "./bookmarks.repository.js";
import jobsRepository from "../jobs/jobs.repository.js";
import i18next from "i18next";
import { AuthError, NotFoundError } from "../exceptions/index.js";


const addNewBookmark = async (job_id, user_id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const exsitingJob = await jobsRepository.getJobById(job_id)
  
  if(!exsitingJob) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") }))

  const id = await bookmarksRepository.addNewBookmark({ job_id, user_id });

  return id;
};

const countBookmarksById = async (user_id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await bookmarksRepository.countBookmarksById(user_id);

  return result;
};

const getBookmarkById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await bookmarksRepository.getBookmarkById(id);

  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.bookmark") }));

  return result;
};

const deleteBookmarkById = async (id, user) => {

  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const result = await bookmarksRepository.deleteBookmarkById(id);
  
  return result;
};
export {
  addNewBookmark,
  countBookmarksById,
  getBookmarkById,
  deleteBookmarkById,
};
