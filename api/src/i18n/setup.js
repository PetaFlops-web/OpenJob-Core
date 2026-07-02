import i18next from "i18next";
import i18nextFsBackend from "i18next-fs-backend";
import path from "path";
import { AsyncLocalStorage } from "async_hooks";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let initialized = false;
const localeStorage = new AsyncLocalStorage();

const initI18n = async () => {
  if (initialized) return i18next;

  await i18next.use(i18nextFsBackend).init({
    lng: "en",
    fallbackLng: "en",
    preload: ["en", "id"],
    ns: ["common", "validation", "emails"],
    defaultNS: "common",
    backend: {
      loadPath: path.resolve(__dirname, "../../locales/{{lng}}/{{ns}}.json"),
    },
    interpolation: {
      prefix: "{{",
      suffix: "}}",
    },
    returnObjects: false,
  });

  const translate = i18next.t.bind(i18next);
  i18next.t = (key, options = {}) => {
    const lng = options.lng || localeStorage.getStore() || i18next.language;
    return translate(key, { ...options, lng });
  };

  initialized = true;
  return i18next;
};



const runWithLocale = (locale, callback) => localeStorage.run(locale, callback);

export { initI18n, runWithLocale };
