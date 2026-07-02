import { formatJoiError } from "../utils/joi-error.js";
import response from "../utils/response.js";
import { ClientError } from "../exceptions/index.js";
import multer from "multer";

function errorHandler(err, req, res, _next) {
  if (err instanceof ClientError) {
    return response(res, err.statusCode, err.message, null);
  }

  if (err.isJoi) return response(res, 400, formatJoiError(err, req.t), null);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return response(res, 400, req.t("error.fileTooLarge"), null);
    return response(res, 400, err.message, null);
  }

  if (err.message === "File is required")
    return response(res, 400, req.t("error.fileRequired"), null);

  const status = err.statusCode || err.status || 500;
  const message = status === 500 ? req.t("error.internal") : (err.message || req.t("error.internal"));
  return response(res, status, message, null);
}

export default errorHandler;
