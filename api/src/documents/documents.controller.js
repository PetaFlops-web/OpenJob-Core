import {
  addNewDocument,
  deleteDocumentById,
  getAlldocuments,
  getDocumentById,
} from "./documents.service.js";
import path from "path";
import response from "../utils/response.js";

const uploadDocumentHandler = async (req, res) => {
  try {
    const { file } = req;
    const user = req.user;
    const autoScan = req.query.scan === "true";
    const result = await addNewDocument(file, user, autoScan);
    return response(res, 201, req.t("success.created", { resource: req.t("resource.document") }), result);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "InvariantError")
      return response(res, 400, error.message, null);

    if (error.name === "UnsupportedMediaError")
      return response(res, 400, error.message, null);

    return response(res, 500, req.t("error.internal"), null);
  }
};

const getDocumentsHandler = async (req, res) => {
  try {
    const documents = await getAlldocuments(req.user);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.document") }), { documents });
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 403, req.t("error.forbidden"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const getDocumentByIdHandler = async (req, res) => {
  try {
    const { documentId: id } = req.params;
    const document = await getDocumentById(id, req.user);

    const documentsDirectory = path.resolve(process.cwd(), "src/documents/pdf");
    const filePath = path.resolve(document.file_url);
    const relativePath = path.relative(documentsDirectory, filePath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return response(res, 404, req.t("error.notFound", { resource: req.t("resource.document") }), null);
    }

    const fileName = path.basename(document.file_url);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.sendFile(filePath);
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

const deleteDocumentHandler = async (req, res) => {
  try {
    const { documentId: id } = req.params;
    const user = req.user;
    await deleteDocumentById(id, user);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.document") }));
  } catch (error) {
    if (error.name === "AuthError")
      return response(res, 401, req.t("error.unauthorized"), null);
    if (error.name === "NotFoundError")
      return response(res, 404, error.message, null);
    return response(res, 500, req.t("error.internal"), null);
  }
};

export {
  uploadDocumentHandler,
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
};
