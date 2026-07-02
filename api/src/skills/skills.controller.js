import {
  getSkillsByUserId,
  addSkill,
  addSkillsBulk,
  deleteSkill,
  deleteAllSkills,
} from "./skills.service.js";
import response from "../utils/response.js";

const getSkillsHandler = async (req, res) => {
  try {
    const skills = await getSkillsByUserId(req.user.id);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.skill") }), { skills });
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getSkillsByUserHandler = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const skills = await getSkillsByUserId(userId);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.skill") }), { skills });
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const addSkillHandler = async (req, res) => {
  try {
    const { name } = req.body;
    const skill = await addSkill(req.user.id, name);

    if (!skill) {
      return response(res, 400, req.t("error.failedToCreate", { resource: req.t("resource.skill") }), null);
    }

    return response(res, 201, req.t("success.created", { resource: req.t("resource.skill") }), skill);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const addSkillsBulkHandler = async (req, res) => {
  try {
    const { skills: names } = req.body;
    const result = await addSkillsBulk(req.user.id, names);
    return response(res, 201, req.t("success.created", { resource: req.t("resource.skill") }), result);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteSkillHandler = async (req, res) => {
  try {
    const { skillId } = req.params;
    await deleteSkill(skillId, req.user.id);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.skill") }), null);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteAllSkillsHandler = async (req, res) => {
  try {
    await deleteAllSkills(req.user.id);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.skill") }), null);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  getSkillsHandler,
  getSkillsByUserHandler,
  addSkillHandler,
  addSkillsBulkHandler,
  deleteSkillHandler,
  deleteAllSkillsHandler,
};
