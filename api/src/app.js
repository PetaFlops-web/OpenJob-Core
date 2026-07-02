import routerFirebase from "./routes/firebase.route.js";
import express from "express";
import routerUser from "./routes/users.route.js";
import routerAuthentication from "./routes/authentication.route.js";
import routerCompany from "./routes/companies.route.js";
import routerCategories from "./routes/categories.route.js";
import routerJobs from "./routes/jobs.route.js";
import routerApplication from "./routes/application.route.js";
import routerBookMark from "./routes/bookmarks.route.js";
import routerDocument from "./routes/documents.route.js";
import routerProfile from "./routes/profile.route.js";
import routerDeveloper from "./routes/developer.route.js";
import routerInterview from "./routes/interviews.route.js";
import routerNotification from "./routes/notifications.route.js";
import routerAuth from "./routes/auth.route.js";
import routerAts from "./ats/ats.route.js";
import routerSkills from "./routes/skills.route.js";
import errorHandler from "./middlewares/error.js";
import corsMiddleware from "./middlewares/cors.js";
import i18nMiddleware from "./middlewares/i18n.js";
import logger from "./middlewares/logger.js";
import { globalRateLimit, authRateLimit, apiRateLimit } from "./middlewares/rate-limit.js";
import healthCheckHandler from "./health/health.controller.js";
import { setupSwagger } from "./swagger.js";
import process from "process";

const app = express();

app.use(corsMiddleware);

app.use(logger);

app.use(i18nMiddleware);
app.use(globalRateLimit);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/profile/uploads", express.static(`${process.cwd()}/src/profile/uploads`));
app.use("/companies/uploads", express.static(`${process.cwd()}/src/companies/uploads`));

app.get("/health", healthCheckHandler);

setupSwagger(app);

app.use("/users", routerUser);
app.use("/authentications", authRateLimit, routerAuthentication);
app.use("/companies", routerCompany);
app.use("/categories", apiRateLimit, routerCategories);
app.use("/jobs", routerJobs);
app.use("/applications", routerApplication);
app.use("/bookmarks", routerBookMark);
app.use("/documents", apiRateLimit, routerDocument);
app.use("/profile", routerProfile);
app.use("/skills", routerSkills);
app.use("/developer", apiRateLimit, routerDeveloper);
app.use("/interviews", routerInterview);
app.use("/notifications", routerNotification);
app.use("/ats", apiRateLimit, routerAts);
app.use("/auth", apiRateLimit, routerAuth);
app.use("/firebase", routerFirebase);

app.use(errorHandler);

export default app;