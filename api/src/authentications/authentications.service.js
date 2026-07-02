import i18next from "i18next";
import TokenManager from "../security/token-manager.js";
import AuthenticationRepository from "./authentication.repository.js";
import userRepository from "../users/user.repository.js";
import { AuthError, NotFoundError } from "../exceptions/index.js";

const addAuthentication = async (payload) => {
  const { email, password } = payload;

  const checkUser = await userRepository.checkUserEmail(email);
  if (!checkUser) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.user") }));

  const verifyCredential = await AuthenticationRepository.verifyUserCredential({
    email,
    password,
  });

  if (!verifyCredential) throw new AuthError(i18next.t("error.invalidCredentials"));

  if (checkUser.mfa_enabled) {
    const mfaToken = TokenManager.generateMFAToken({
      id: verifyCredential.id,
      purpose: "mfa_verify",
    });
    return { mfa_required: true, mfa_token: mfaToken };
  }

  const accessToken = TokenManager.generateAccessToken({
    id: verifyCredential.id,
    role: verifyCredential.role,
  });
  const refreshToken = TokenManager.generateRefreshToken({
    id: verifyCredential.id,
  });

  await AuthenticationRepository.token(refreshToken);

  return { accessToken, refreshToken };
};

const refreshTokenAuth = async (refreshToken) => {
  const result =
    await AuthenticationRepository.verifyRefreshToken(refreshToken);

  if (!result) throw new AuthError(i18next.t("error.invalidRefreshToken"));

  const { id } = TokenManager.verifyRefreshToken(refreshToken);
  const user = await userRepository.getUserById(id);
  if (!user) throw new AuthError(i18next.t("error.invalidRefreshToken"));
  const accessToken = TokenManager.generateAccessToken({ id, role: user.role });

  return { accessToken };
};

const deleteRefreshToken = async (refreshToken) => {
  const verify =
    await AuthenticationRepository.verifyRefreshToken(refreshToken);

  if (!verify) throw new AuthError(i18next.t("error.invalidRefreshToken"));

  const result =
    await AuthenticationRepository.deleteRefreshToken(refreshToken);

  return result;
};

export { addAuthentication, refreshTokenAuth, deleteRefreshToken };
