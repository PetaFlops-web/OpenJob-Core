import i18next from "i18next";
import fs, { openAsBlob } from "fs";
import path from "path";
import process from "process";
import atsRepository from "./ats.repository.js";
import { AuthError, NotFoundError, InvariantError } from "../exceptions/index.js";

const DEFAULT_ATS_ML_API_URL = "http://localhost:5000";
const ATS_SCORING_ENDPOINT = "/api/v1/ats/analyze";

const getAtsMlApiUrl = () => process.env.ATS_ML_API_URL || DEFAULT_ATS_ML_API_URL;

const getAtsMlApiKey = () => process.env.ATS_ML_API_KEY || "";

/**
 * Ensure a document path points to a readable PDF file.
 * @param {string} filePath
 * @returns {string}
 */
const assertPdfFileExists = (filePath) => {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError(i18next.t("error.pdfFileNotFound"));
  }

  return absolutePath;
};

const readAtsResponseBody = async (response) => {
  const body = await response.text();
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return { error: body };
  }
};

/**
 * Call Flask ATS scoring endpoint with the original PDF file.
 * @param {string} filePath
 * @param {{skills?: string, jobSummary?: string}} context
 * @returns {Promise<{ats_score: number, cv_chars: number|null, skills_chars: number|null, job_summary_chars: number|null}>}
 */
const callAtsScoring = async (filePath, context = {}) => {
  const absolutePath = assertPdfFileExists(filePath);
  const formData = new FormData();
  const cvBlob = await openAsBlob(absolutePath, { type: "application/pdf" });
  const skills = context.skills || "";
  const jobSummary = context.jobSummary || "";

  formData.set("cv", cvBlob, path.basename(absolutePath));
  if (skills) formData.set("skills", skills);
  if (jobSummary) formData.set("job_summary", jobSummary);

  const atsMlApiKey = getAtsMlApiKey();
  let scoringResponse;
  try {
    scoringResponse = await fetch(`${getAtsMlApiUrl()}${ATS_SCORING_ENDPOINT}`, {
      method: "POST",
      headers: atsMlApiKey ? { "X-Internal-API-Key": atsMlApiKey } : undefined,
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new Error(`ATS scoring request failed: ${error.message}`, { cause: error });
  }

  const payload = await readAtsResponseBody(scoringResponse);
  if (!scoringResponse.ok || payload?.success === false) {
    throw new Error(
      `ATS scoring API error (${scoringResponse.status}): ${payload?.error || "Unknown error"}`,
    );
  }

  const data = payload?.data ?? payload;
  const atsScore = Number(data?.ats_score);
  if (!Number.isFinite(atsScore)) {
    throw new Error("ATS scoring API response missing numeric data.ats_score");
  }

  return {
    ats_score: atsScore,
    cv_chars: data.cv_chars ?? null,
    skills_chars: data.skills_chars ?? null,
    job_summary_chars: data.job_summary_chars ?? null,
  };
};

/**
 * Scan a CV document: send the PDF to Flask ATS scoring, then store results.
 * @param {string} documentId
 * @param {string} userId
 * @param {{skills?: string, jobSummary?: string}} context
 * @returns {Promise<object>} analysis result with ats_score
 */
const scanCvDocument = async (documentId, userId, context = {}) => {
  if (!userId) throw new AuthError(i18next.t("error.invalidCredentials"));
  if (!documentId) throw new InvariantError(i18next.t("error.documentIdRequired"));

  const { default: documentsRepository } = await import("../documents/documents.repository.js");
  const document = await documentsRepository.getDocumentById(documentId, userId);
  if (!document) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));

  const analysis = await callAtsScoring(document.file_url, context);

  const analysisId = await atsRepository.saveCvAnalysis({
    documentId,
    userId,
    atsScore: analysis.ats_score,
    skills: [],
    experienceYears: 0,
    educationLevel: "",
    rawText: null,
  });

  return {
    analysisId,
    ats_score: analysis.ats_score,
    cv_chars: analysis.cv_chars,
    skills_chars: analysis.skills_chars,
    job_summary_chars: analysis.job_summary_chars,
  };
};

/**
 * Get CV analysis history for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getUserCvAnalyses = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.invalidCredentials"));
  return atsRepository.getCvAnalysisByUserId(userId);
};

export { scanCvDocument, getUserCvAnalyses, callAtsScoring };
