import { Router } from "express";
import { firebaseLogin } from "../security/firebase.service.js";
import response from "../utils/response.js";

const routerFirebase = Router();

routerFirebase.post("/login", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return response(res, 400, req.t("error.invalidToken"), null);
    }
    const tokens = await firebaseLogin(idToken);
    return response(res, 200, req.t("success.login"), tokens);
  } catch (error) {
    next(error);
  }
});

export default routerFirebase;
