import i18next from "i18next";
import skillsRepository from "./skills.repository.js";
import { AuthError, NotFoundError } from "../exceptions/index.js";

const getSkillsByUserId = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.loginRequired"));
  return skillsRepository.findAllByUserId(userId);
};

const addSkill = async (userId, name) => {
  if (!userId) throw new AuthError(i18next.t("error.loginRequired"));

  const skill = await skillsRepository.create(userId, name.trim());
  return skill;
};

const addSkillsBulk = async (userId, names) => {
  if (!userId) throw new AuthError(i18next.t("error.loginRequired"));

  const added = [];
  const skipped = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;

    const skill = await skillsRepository.create(userId, name);
    if (skill) {
      added.push(skill);
    } else {
      skipped.push(name);
    }
  }

  return { added, skipped };
};

const deleteSkill = async (id, userId) => {
  if (!userId) throw new AuthError(i18next.t("error.loginRequired"));

  const deleted = await skillsRepository.delete(id, userId);
  if (!deleted) {
    throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.skill") }));
  }

  return deleted;
};

const deleteAllSkills = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.loginRequired"));
  await skillsRepository.deleteAllByUserId(userId);
};

const getSkillsAsString = async (userId) => {
  const skills = await skillsRepository.findAllByUserId(userId);
  if (!skills.length) return "";
  return skills.map((s) => s.name).join(", ");
};

export {
  getSkillsByUserId,
  addSkill,
  addSkillsBulk,
  deleteSkill,
  deleteAllSkills,
  getSkillsAsString,
};
