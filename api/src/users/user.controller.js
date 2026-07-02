import { addUser, getUserById } from "./user.service.js";
import response from "../utils/response.js";
import CacheService from "../cache/redis.service.js";
import logger from "../utils/logger.js";

const addUserHandler = async (req, res) => {
  try {
    const { name, email, password, role } = req.validate;

    const user = await addUser({ name, email, password, role });

    logger.log(user);

    const cache = new CacheService();
    await cache.delete(`user-${user}`);

    return response(res, 201, req.t("success.created", { resource: req.t("resource.user") }), { id: user });
  } catch (error) {
    logger.error(error);
    if (error.name === "InvariantError")
      return response(res, 400, error.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getUserByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const cache = new CacheService();
    const cachedUser = await cache.get(`user-${id}`);

    if (cachedUser) {
      res.header("X-Data-Source", "cache");
      return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.user") }), JSON.parse(cachedUser));
    }

    const user = await getUserById(id);
    await cache.set(`user-${id}`, JSON.stringify(user));
    res.header("X-Data-Source", "database");
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.user") }), user);
  } catch (error) {
    logger.error(error);

    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

export { addUserHandler, getUserByIdHandler };
