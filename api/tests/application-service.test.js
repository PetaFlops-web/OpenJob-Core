import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addNewApplication,
  getAllApplications,
  getApplicationById,
  getApplicationByUserId,
  getApplicationByJobId,
  updateApplicationById,
  deleteApplicationById,
} from "../src/applications/application.service.js";

vi.mock("../src/applications/application.repository.js", () => ({
  default: {
    addNewApplication: vi.fn(),
    checkDuplicateApplication: vi.fn(),
    getAllApplications: vi.fn(),
    getApplicationById: vi.fn(),
    getApplicationByUserId: vi.fn(),
    getApplicationByJobId: vi.fn(),
    updateApplicationById: vi.fn(),
    deleteApplicationById: vi.fn(),
  },
}));

vi.mock("../src/documents/documents.repository.js", () => ({
  default: {
    getDocumentById: vi.fn(),
  },
}));

vi.mock("../src/jobs/jobs.repository.js", () => ({
  default: {
    getJobById: vi.fn(),
  },
}));

vi.mock("../src/export/producer.js", () => ({
  sendMessage: vi.fn(),
}));

vi.mock("../src/ats/ats.repository.js", () => ({
  default: {
    getCvAnalysisByDocumentId: vi.fn(),
  },
}));

import applicationRepository from "../src/applications/application.repository.js";
import jobsRepository from "../src/jobs/jobs.repository.js";
import { sendMessage } from "../src/export/producer.js";

describe("Application Service", () => {
  const mockUser = { id: "user-abc123", role: "jobseeker" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("addNewApplication", () => {
    it("should create a new application successfully", async () => {
      const payload = { job_id: "job-abc123", status: "pending", document_id: "doc-abc123" };

      const { default: documentsRepository } = await import("../src/documents/documents.repository.js");
      documentsRepository.getDocumentById.mockResolvedValue({ id: "doc-abc123", user_id: mockUser.id });
      jobsRepository.getJobById.mockResolvedValue({ id: "job-abc123", title: "Dev" });
      const { default: atsRepository } = await import("../src/ats/ats.repository.js");
      atsRepository.getCvAnalysisByDocumentId.mockResolvedValue({
        ats_score: 23.62,
      });
      applicationRepository.checkDuplicateApplication.mockResolvedValue(null);
      applicationRepository.addNewApplication.mockResolvedValue({
        id: "app-abc123",
        job_id: "job-abc123",
        user_id: "user-abc123",
        status: "pending",
        document_id: "doc-abc123",
      });
      sendMessage.mockResolvedValue();

      const result = await addNewApplication(payload, mockUser);
      expect(result.id).toBe("app-abc123");
      expect(result.job_id).toBe("job-abc123");
      expect(result.document_id).toBe("doc-abc123");
      expect(applicationRepository.checkDuplicateApplication).toHaveBeenCalledWith(
        "job-abc123",
        "user-abc123"
      );
      expect(sendMessage).toHaveBeenCalledWith("application_created", {
        application_id: "app-abc123",
      });
    });

    it("should throw AuthError if user is not authenticated", async () => {
      await expect(addNewApplication({ job_id: "job-1" }, null)).rejects.toThrow();
    });

    it("should throw NotFoundError if job does not exist", async () => {
      jobsRepository.getJobById.mockResolvedValue(null);

      await expect(
        addNewApplication({ job_id: "nonexistent" }, mockUser)
      ).rejects.toThrow();
    });

    it("should throw InvariantError if duplicate application exists", async () => {
      jobsRepository.getJobById.mockResolvedValue({ id: "job-1" });
      applicationRepository.checkDuplicateApplication.mockResolvedValue({
        id: "existing-app",
      });

      await expect(
        addNewApplication({ job_id: "job-1" }, mockUser)
      ).rejects.toThrow();
    });

    it("should throw InvariantError if application creation fails", async () => {
      jobsRepository.getJobById.mockResolvedValue({ id: "job-1" });
      applicationRepository.checkDuplicateApplication.mockResolvedValue(null);
      applicationRepository.addNewApplication.mockResolvedValue(null);

      await expect(
        addNewApplication({ job_id: "job-1" }, mockUser)
      ).rejects.toThrow();
    });
  });

  describe("getAllApplications", () => {
    it("should return current user's applications", async () => {
      const mockApps = [
        { id: "app-1", job_id: "job-1", user_id: "user-1" },
      ];

      applicationRepository.getApplicationByUserId.mockResolvedValue(mockApps);

      const result = await getAllApplications(mockUser.id, mockUser);

      expect(result).toEqual(mockApps);
      expect(result).toHaveLength(1);
      expect(applicationRepository.getApplicationByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    it("should throw AuthError if user is null", async () => {
      await expect(getAllApplications(mockUser.id, null)).rejects.toThrow();
    });
  });

  describe("getApplicationById", () => {
    it("should return an application by ID", async () => {
      const mockApp = { id: "app-abc123", job_id: "job-1" };

      applicationRepository.getApplicationById.mockResolvedValue(mockApp);

      const result = await getApplicationById("app-abc123", mockUser);

      expect(result).toEqual(mockApp);
    });

    it("should throw NotFoundError if application not found", async () => {
      applicationRepository.getApplicationById.mockResolvedValue(null);

      await expect(
        getApplicationById("nonexistent", mockUser)
      ).rejects.toThrow();
    });
  });

  describe("getApplicationByUserId", () => {
    it("should return applications for a specific user", async () => {
      const mockApps = [{ id: "app-1", user_id: "user-abc123" }];

      applicationRepository.getApplicationByUserId.mockResolvedValue(mockApps);

      const result = await getApplicationByUserId("user-abc123", mockUser);

      expect(result).toEqual(mockApps);
    });

    it("should throw AuthError if user is null", async () => {
      await expect(getApplicationByUserId("user-1", null)).rejects.toThrow();
    });
  });

  describe("getApplicationByJobId", () => {
    it("should return applications for a specific job", async () => {
      const mockApps = [{ id: "app-1", job_id: "job-abc123" }];

      applicationRepository.getApplicationByJobId.mockResolvedValue(mockApps);

      const result = await getApplicationByJobId("job-abc123", mockUser);

      expect(result).toEqual(mockApps);
    });
  });

  describe("updateApplicationById", () => {
    it("should update an application successfully", async () => {
      applicationRepository.getApplicationById.mockResolvedValue({
        id: "app-abc123",
        user_id: mockUser.id,
      });
      applicationRepository.updateApplicationById.mockResolvedValue("app-abc123");

      const result = await updateApplicationById(
        "app-abc123",
        { status: "accepted" },
        mockUser
      );

      expect(result).toBe("app-abc123");
    });

    it("should throw AuthError if user is null", async () => {
      await expect(
        updateApplicationById("app-1", { status: "accepted" }, null)
      ).rejects.toThrow();
    });
  });

  describe("deleteApplicationById", () => {
    it("should delete an application successfully", async () => {
      applicationRepository.getApplicationById.mockResolvedValue({
        id: "app-abc123",
        user_id: mockUser.id,
      });
      applicationRepository.deleteApplicationById.mockResolvedValue("app-abc123");

      const result = await deleteApplicationById("app-abc123", mockUser);

      expect(result).toBe("app-abc123");
    });

    it("should throw AuthError if user is null", async () => {
      await expect(deleteApplicationById("app-1", null)).rejects.toThrow();
    });
  });
});
