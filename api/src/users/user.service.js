import i18next from "i18next";
import userRepository from "./user.repository.js";
import { addUserSchema } from "./schema-user.js";
import { formatJoiError } from "../utils/joi-error.js";
import { InvariantError, NotFoundError } from "../exceptions/index.js";

const addUser = async (payload) => {
  const { error, value } = addUserSchema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    throw new InvariantError(formatJoiError(error, i18next.t).join(", "));
  }

  const checkEmail = await userRepository.checkUserEmail(value.email);
  if (checkEmail) throw new InvariantError(i18next.t("error.emailAlreadyRegistered"));
  const user = await userRepository.addNewUser(value);

  return user;
};

const getUserById = async (id) => {
  const user = await userRepository.getUserById(id);

  if (!user) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.user") }));

  return user;
};

export { addUser, getUserById };
