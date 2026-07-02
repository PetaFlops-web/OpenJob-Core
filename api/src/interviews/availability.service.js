import i18next from "i18next";
import AvailabilityRepository from "./availability.repository.js";
import { AuthError, InvariantError, NotFoundError } from "../exceptions/index.js";

const setAvailability = async (payload, user) => {
  
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const id = await AvailabilityRepository.setAvailability(payload);

  if (!id) throw new InvariantError(i18next.t("error.failedToSave", { resource: i18next.t("resource.availability") }));

  return id;
};

const getAvailability = async (companyId, user) => {

  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  return await AvailabilityRepository.getAvailability(companyId);
};

const deleteAvailability = async (id, user) => {

  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const result = await AvailabilityRepository.deleteAvailability(id);

  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.availability") }));
 
  return result;
};

export { setAvailability, getAvailability, deleteAvailability };
