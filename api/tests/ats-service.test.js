import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { getUserCvAnalyses, callAtsScoring, scanCvDocument } from "../src/ats/ats.service.js";

vi.mock("../src/ats/ats.repository.js", () => ({
  default: {
    saveCvAnalysis: vi.fn(),
    getCvAnalysisByDocumentId: vi.fn(),
    getCvAnalysisByUserId: vi.fn(),
  },
}));

vi.mock("../src/documents/documents.repository.js", () => ({
  default: {
    getDocumentById: vi.fn(),
  },
}));

vi.mock("i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import atsRepository from "../src/ats/ats.repository.js";
import documentsRepository from "../src/documents/documents.repository.js";

const createTempPdf = async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openjob-ats-"));
  const pdfPath = path.join(tempDir, "cv.pdf");
  await writeFile(pdfPath, "%PDF-1.4\n% test pdf\n");
  return { tempDir, pdfPath };
};

describe("ATS Service", () => {
  let tempDir;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ATS_ML_API_URL", "http://localhost:5000");
    vi.stubEnv("ATS_ML_API_KEY", "");
    global.fetch = vi.fn();
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
    vi.unstubAllGlobals();
  });

  describe("callAtsScoring", () => {
    it("should send PDF multipart request to Flask ATS scoring endpoint", async () => {
      const tempPdf = await createTempPdf();
      tempDir = tempPdf.tempDir;

      global.fetch.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: {
          ats_score: 82.35,
          cv_chars: 12345,
          skills_chars: 31,
          job_summary_chars: 58,
        },
      }), { status: 200 }));

      const result = await callAtsScoring(tempPdf.pdfPath, {
        skills: "Python, Flask, Machine Learning",
        jobSummary: "Backend engineer dengan pengalaman Python dan REST API",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, request] = global.fetch.mock.calls[0];
      expect(url).toBe("http://localhost:5000/api/v1/ats/analyze");
      expect(request.method).toBe("POST");
      expect(request.body).toBeInstanceOf(FormData);
      expect(request.body.get("cv")).toBeInstanceOf(Blob);
      expect(request.body.get("skills")).toBe("Python, Flask, Machine Learning");
      expect(request.body.get("job_summary")).toBe("Backend engineer dengan pengalaman Python dan REST API");
      expect(result).toEqual({
        ats_score: 82.35,
        cv_chars: 12345,
        skills_chars: 31,
        job_summary_chars: 58,
      });
    });

    it("should reject Flask responses without numeric ats_score", async () => {
      const tempPdf = await createTempPdf();
      tempDir = tempPdf.tempDir;

      global.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));

      await expect(callAtsScoring(tempPdf.pdfPath)).rejects.toThrow("data.ats_score");
    });
  });

  describe("scanCvDocument", () => {
    it("should score stored document through Flask ATS endpoint and persist ats_score", async () => {
      const tempPdf = await createTempPdf();
      tempDir = tempPdf.tempDir;

      documentsRepository.getDocumentById.mockResolvedValue({ id: "document-123", file_url: tempPdf.pdfPath });
      atsRepository.saveCvAnalysis.mockResolvedValue("cv-analysis-123");
      global.fetch.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: {
          ats_score: 91.5,
          cv_chars: 8000,
          skills_chars: 0,
          job_summary_chars: 0,
        },
      }), { status: 200 }));

      const result = await scanCvDocument("document-123", "user-123");

      expect(documentsRepository.getDocumentById).toHaveBeenCalledWith("document-123", "user-123");
      expect(atsRepository.saveCvAnalysis).toHaveBeenCalledWith({
        documentId: "document-123",
        userId: "user-123",
        atsScore: 91.5,
        skills: [],
        experienceYears: 0,
        educationLevel: "",
        rawText: null,
      });
      expect(result).toEqual({
        analysisId: "cv-analysis-123",
        ats_score: 91.5,
        cv_chars: 8000,
        skills_chars: 0,
        job_summary_chars: 0,
      });
    });
  });

  describe("getUserCvAnalyses", () => {
    it("should return CV analyses array for a user", async () => {
      const mockAnalyses = [
        {
          id: "cv-analysis-abc123",
          document_id: "doc-1",
          user_id: "user-123",
          ats_score: 82.35,
          skills: [],
          experience_years: 0,
          education_level: "",
          created_at: "2024-01-15T10:00:00Z",
          file_url: "https://example.com/cv1.pdf",
        },
        {
          id: "cv-analysis-def456",
          document_id: "doc-2",
          user_id: "user-123",
          ats_score: 77.4,
          skills: [],
          experience_years: 0,
          education_level: "",
          created_at: "2024-01-10T08:00:00Z",
          file_url: "https://example.com/cv2.pdf",
        },
      ];

      atsRepository.getCvAnalysisByUserId.mockResolvedValue(mockAnalyses);

      const result = await getUserCvAnalyses("user-123");

      expect(result).toEqual(mockAnalyses);
      expect(atsRepository.getCvAnalysisByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should return empty array when user has no analyses", async () => {
      atsRepository.getCvAnalysisByUserId.mockResolvedValue([]);

      const result = await getUserCvAnalyses("user-456");

      expect(result).toEqual([]);
      expect(atsRepository.getCvAnalysisByUserId).toHaveBeenCalledWith("user-456");
    });

    it("should throw AuthError when userId is not provided", async () => {
      await expect(getUserCvAnalyses()).rejects.toThrow("error.invalidCredentials");
      expect(atsRepository.getCvAnalysisByUserId).not.toHaveBeenCalled();
    });

    it("should throw AuthError when userId is empty string", async () => {
      await expect(getUserCvAnalyses("")).rejects.toThrow("error.invalidCredentials");
      expect(atsRepository.getCvAnalysisByUserId).not.toHaveBeenCalled();
    });
  });
});
