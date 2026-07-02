import { runWithLocale } from "../i18n/setup.js";
import i18next from "i18next";

const SUPPORTED_LOCALES = ["id", "en"];

const i18nMiddleware = (req, res, next) => {
  const acceptLanguage = req.headers["accept-language"] || req.query.lang || "id";
  const lang = acceptLanguage.substring(0, 2);
  const resolvedLang = SUPPORTED_LOCALES.includes(lang) ? lang : "id";


  return runWithLocale(resolvedLang, () => {
    req.t = (key, options = {}) => i18next.t(key, { ...options, lng: resolvedLang });
    return next();
  });
};

export default i18nMiddleware;
