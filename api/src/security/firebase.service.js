import i18next from "i18next";
import TokenManager from "./token-manager.js";
import userRepository from "../users/user.repository.js";
import AuthenticationRepository from "../authentications/authentication.repository.js";
import { initFirebase } from "./firebase-admin.js";

const firebaseLogin = async (idToken) => {
  const app = initFirebase();
  const decoded = await app.auth().verifyIdToken(idToken);

  if (!decoded.email) {
    throw new Error(i18next.t("error.invalidCredentials"));
  }

  let user = await userRepository.checkUserEmail(decoded.email);

  if (!user) {
    throw new Error(i18next.t("error.notFound", { resource: i18next.t("resource.user") }));
  }

  // skip bcrypt — Firebase already validated the password
  const accessToken = TokenManager.generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = TokenManager.generateRefreshToken({
    id: user.id,
  });

  await AuthenticationRepository.token(refreshToken);

  return { accessToken, refreshToken };
};

export { firebaseLogin };
