import {
  getProfileUserById,
  getProfileUserApplications,
  getProfileUserBookmarkedJobs,
  getProfileUserInterviews,
  getProfileInterviewById,
  updateProfile,
  uploadAvatar,
} from "./profile.service.js";
import response from "../utils/response.js";
import CacheService from "../cache/redis.service.js";

const getProfileUserByIdHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const cache = new CacheService();
    const cachedProfile = await cache.get(`profile-${userId}`);

    if (cachedProfile) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.user") }), JSON.parse(cachedProfile));
    }

    const user = await getProfileUserById(userId);
    await cache.set(`profile-${userId}`, JSON.stringify(user));
    res.header("X-Data-Source", "database");
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.user") }), user);
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getProfileUserApplicationsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const cache = new CacheService();
    const cachedApplications = await cache.get(`profile-applications-v2-${userId}`);

    if (cachedApplications) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
        applications: JSON.parse(cachedApplications),
      });
    }

    const applications = await getProfileUserApplications(userId);
    await cache.set(`profile-applications-v2-${userId}`, JSON.stringify(applications));
    res.header("X-Data-Source", "database");
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.application") }), {
      applications,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getProfileUserBookmarkedJobsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const cache = new CacheService();
    const cachedBookmarks = await cache.get(`profile-bookmarked-jobs-${userId}`);

    if (cachedBookmarks) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.bookmark") }), {
        bookmarks: JSON.parse(cachedBookmarks),
      });
    }

    const bookmarkedJobs = await getProfileUserBookmarkedJobs(userId);
    await cache.set(`profile-bookmarked-jobs-${userId}`, JSON.stringify(bookmarkedJobs));
    res.header("X-Data-Source", "database");
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.bookmark") }), {
      bookmarks: bookmarkedJobs,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getProfileUserInterviewsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await getProfileUserInterviews(userId);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.interview") }), {
      interviews,
    });
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getProfileInterviewByIdHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.params;
    const interview = await getProfileInterviewById(interviewId, userId);

    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.interview") }), interview);
  } catch (err) {
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const updateProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const cache = new CacheService();

    await cache.delete(`profile-${userId}`);
    await cache.delete(`user-${userId}`);

    const updatedUser = await updateProfile(userId, req.body);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.user") }), updatedUser);
  } catch (err) {
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const uploadAvatarHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const cache = new CacheService();

    await cache.delete(`profile-${userId}`);
    await cache.delete(`user-${userId}`);

    const result = await uploadAvatar(userId, req.file);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.avatar") }), result);
  } catch (err) {
    if (err.name === "AuthError") return response(res, 401, req.t("error.unauthorized"), null);
    if (err.name === "NotFoundError") return response(res, 404, err.message, null);
    if (err.name === "InvariantError") return response(res, 400, err.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  getProfileUserByIdHandler,
  getProfileUserApplicationsHandler,
  getProfileUserBookmarkedJobsHandler,
  getProfileUserInterviewsHandler,
  getProfileInterviewByIdHandler,
  updateProfileHandler,
  uploadAvatarHandler,
};
