import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addNewJob,
  updateJobById,
  deleteJobById,
  getAllJobs,
  getJobsByCompany,
  getJobByCategory,
  getJobById,
} from "../src/jobs/jobs.service.js";

// Mock the repository module
vi.mock("../src/jobs/jobs.repository.js", () => ({
  default: {
    addNewJob: vi.fn(),
    updateJobById: vi.fn(),
    deleteJobById: vi.fn(),
    getAllJobs: vi.fn(),
    getJobsByCompany: vi.fn(),
    getJobByCategory: vi.fn(),
    getJobById: vi.fn(),
  },
}));

import jobsRepository from "../src/jobs/jobs.repository.js";

describe("Jobs Service", () => {
  const mockUser = { id: "user-abc123", role: "employer" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addNewJob", () => {
    it("should create a new job successfully", async () => {
      const payload = {
        title: "Frontend Developer",
        description: "We need a dev",
        job_type: "full-time",
        experience_level: "mid",
        company_id: "company-abc",
        category_id: "category-abc",
        status: "open",
      };

      jobsRepository.addNewJob.mockResolvedValue("job-abc123");

      const result = await addNewJob(payload, mockUser);

      expect(result).toBe("job-abc123");
      expect(jobsRepository.addNewJob).toHaveBeenCalledWith(payload);
    });

    it("should throw AuthError if user is not authenticated", async () => {
      const payload = { title: "Job" };

      await expect(addNewJob(payload, null)).rejects.toThrow();
    });

    it("should throw InvariantError if job creation fails", async () => {
      jobsRepository.addNewJob.mockResolvedValue(null);

      await expect(addNewJob({ title: "Job" }, mockUser)).rejects.toThrow();
    });
  });

  describe("updateJobById", () => {
    it("should update a job successfully", async () => {
      const payload = { title: "Updated Title" };
      jobsRepository.getJobById.mockResolvedValue({ id: "job-abc123" });
      jobsRepository.updateJobById.mockResolvedValue("job-abc123");

      const result = await updateJobById("job-abc123", payload, mockUser);

      expect(result).toBe("job-abc123");
    });

    it("should throw AuthError if user is null", async () => {
      await expect(updateJobById("job-1", {}, null)).rejects.toThrow();
    });

    it("should throw NotFoundError if job not found", async () => {
      jobsRepository.updateJobById.mockResolvedValue(null);

      await expect(updateJobById("nonexistent", {}, mockUser)).rejects.toThrow();
    });
  });

  describe("deleteJobById", () => {
    it("should delete a job successfully", async () => {
      jobsRepository.getJobById.mockResolvedValue({ id: "job-abc123" });
      jobsRepository.deleteJobById.mockResolvedValue("job-abc123");

      const result = await deleteJobById("job-abc123", mockUser);

      expect(result).toBe("job-abc123");
    });

    it("should throw AuthError if user is null", async () => {
      await expect(deleteJobById("job-1", null)).rejects.toThrow();
    });
  });

  describe("getAllJobs", () => {
    it("should return all jobs", async () => {
      const mockJobs = [
        { id: "job-1", title: "Job 1" },
        { id: "job-2", title: "Job 2" },
      ];

      jobsRepository.getAllJobs.mockResolvedValue(mockJobs);

      const result = await getAllJobs();

      expect(result).toEqual(mockJobs);
      expect(result).toHaveLength(2);
    });

    it("should throw NotFoundError if no jobs found", async () => {
      jobsRepository.getAllJobs.mockResolvedValue(null);

      await expect(getAllJobs()).rejects.toThrow();
    });
  });

  describe("getJobsByCompany", () => {
    it("should return jobs for a specific company", async () => {
      const mockJobs = [{ id: "job-1", company_id: "company-abc" }];

      jobsRepository.getJobsByCompany.mockResolvedValue(mockJobs);

      const result = await getJobsByCompany("company-abc");

      expect(result).toEqual(mockJobs);
      expect(jobsRepository.getJobsByCompany).toHaveBeenCalledWith("company-abc");
    });
  });

  describe("getJobByCategory", () => {
    it("should return jobs for a specific category", async () => {
      const mockJobs = [{ id: "job-1", category_id: "category-abc" }];

      jobsRepository.getJobByCategory.mockResolvedValue(mockJobs);

      const result = await getJobByCategory("category-abc");

      expect(result).toEqual(mockJobs);
    });
  });

  describe("getJobById", () => {
    it("should return a single job by ID", async () => {
      const mockJob = { id: "job-abc123", title: "Frontend Dev" };

      jobsRepository.getJobById.mockResolvedValue(mockJob);

      const result = await getJobById("job-abc123");

      expect(result).toEqual(mockJob);
    });

    it("should throw NotFoundError if job not found", async () => {
      jobsRepository.getJobById.mockResolvedValue(null);

      await expect(getJobById("nonexistent")).rejects.toThrow();
    });
  });
});
