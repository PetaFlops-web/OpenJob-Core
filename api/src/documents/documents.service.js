import documentsRepository from "./documents.repository.js";
import i18next from "i18next";
import { AuthError, NotFoundError, UnsupportedMediaError } from "../exceptions/index.js";

const addNewDocument = async (file, user, autoScan = false) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  if (!file) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));
  if (file.size > 5 * 1024 * 1024)
    throw new UnsupportedMediaError(i18next.t("error.fileTooLarge"));
  if (file.mimetype !== "application/pdf")
    throw new UnsupportedMediaError(i18next.t("error.pdfOnly"));
  const id = await documentsRepository.addNewDocument({
    file_url: file.path,
    user_id: user.id,
  });

  const result = {
    documentId: id,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
  };

  // Auto-scan CV document if requested
  if (autoScan) {
    try {
      const { scanCvDocument } = await import("../ats/ats.service.js");
      const analysis = await scanCvDocument(id, user.id);
      result.analysis = analysis;
    } catch (scanError) {
      // Auto-scan failure should not block upload - attach error info
      result.analysis = { error: scanError.message };
    }
  }

  return result;
};

const getAlldocuments = async (user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  return documentsRepository.getAllDocuments(user.id);
};

const getDocumentById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  const result = await documentsRepository.getDocumentById(id, user.id);
  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));
  return result;
};

const deleteDocumentById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  const result = await documentsRepository.deleteDocumentById(id, user.id);
  if (!result) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));
  return result;
};

export { addNewDocument, getAlldocuments, getDocumentById, deleteDocumentById };
