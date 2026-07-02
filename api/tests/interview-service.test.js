import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("i18next", () => ({
  default: {
    t: vi.fn((key, _options) => {
      const map = {
        "error.interviewConflict": "Wawancara bentrok dengan jadwal yang sudah ada",
        "error.notFound": "Interview tidak ditemukan.",
        "error.unauthorized": "invalid credentials",
      };
      return map[key] || key;
    }),
  },
  t: vi.fn((key) => key),
}));

import {
  scheduleInterview,
  getInterviewById,
  cancelInterview,
} from "../src/interviews/interviews.service.js";

// Mock the repository module
vi.mock("../src/interviews/interviews.repository.js", () => ({
  default: {
    checkConflicts: vi.fn(),
    addInterview: vi.fn(),
    getInterviewById: vi.fn(),
    updateInterview: vi.fn(),
    addReminder: vi.fn(),
  },
}));

// Mock the message producer
vi.mock("../src/export/producer.js", () => ({
  sendMessage: vi.fn(),
}));

import interviewsRepository from "../src/interviews/interviews.repository.js";
import { sendMessage } from "../src/export/producer.js";

describe("Interview Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scheduleInterview", () => {
    it("should schedule an interview successfully when no conflicts", async () => {
      const payload = {
        company_id: "company-123",
        user_id: "user-456",
        job_id: "job-789",
        scheduled_at: "2026-07-01T10:00:00Z",
        duration_minutes: 60,
      };
      const user = { id: "user-abc" };

      interviewsRepository.checkConflicts.mockResolvedValue(0);
      interviewsRepository.addInterview.mockResolvedValue("interview-abc123");
      interviewsRepository.addReminder.mockResolvedValue(undefined);
      sendMessage.mockResolvedValue(undefined);

      const result = await scheduleInterview(payload, user);

      expect(result).toBe("interview-abc123");
      expect(interviewsRepository.checkConflicts).toHaveBeenCalledWith(
        "company-123",
        "2026-07-01T10:00:00Z",
        60,
        null,
      );
      expect(interviewsRepository.addInterview).toHaveBeenCalledWith({
        ...payload,
        created_by: "user-abc",
      });
      expect(sendMessage).toHaveBeenCalledWith("interview_scheduled", {
        interview_id: "interview-abc123",
        user_id: "user-456",
        company_id: "company-123",
        job_id: "job-789",
        scheduled_at: "2026-07-01T10:00:00Z",
      });
      expect(interviewsRepository.addReminder).toHaveBeenCalledTimes(3);
    });

    it("should throw InvariantError when scheduling conflicts exist", async () => {
      const payload = {
        company_id: "company-123",
        user_id: "user-456",
        job_id: "job-789",
        scheduled_at: "2026-07-01T10:00:00Z",
        duration_minutes: 60,
      };
      const user = { id: "user-abc" };

      interviewsRepository.checkConflicts.mockResolvedValue(2);

      await expect(scheduleInterview(payload, user)).rejects.toThrow(
        "Wawancara bentrok dengan jadwal yang sudah ada",
      );
      expect(interviewsRepository.addInterview).not.toHaveBeenCalled();
    });
  });

  describe("getInterviewById", () => {
    it("should return interview object if found", async () => {
      const mockInterview = {
        id: "interview-abc123",
        company_id: "company-123",
        user_id: "user-456",
        job_id: "job-789",
        scheduled_at: "2026-07-01T10:00:00Z",
        status: "scheduled",
      };
      const user = { id: "user-abc" };

      interviewsRepository.getInterviewById.mockResolvedValue(mockInterview);

      const result = await getInterviewById("interview-abc123", user);

      expect(result).toEqual(mockInterview);
      expect(interviewsRepository.getInterviewById).toHaveBeenCalledWith(
        "interview-abc123",
      );
    });

    it("should throw NotFoundError if interview not found", async () => {
      const user = { id: "user-abc" };

      interviewsRepository.getInterviewById.mockResolvedValue(null);

      await expect(
        getInterviewById("nonexistent", user),
      ).rejects.toThrow("Interview tidak ditemukan.");
    });
  });

  describe("cancelInterview", () => {
    it("should cancel interview successfully", async () => {
      const user = { id: "user-abc" };
      const mockInterview = {
        id: "interview-abc123",
        status: "scheduled",
      };

      interviewsRepository.getInterviewById.mockResolvedValue(mockInterview);
      interviewsRepository.updateInterview.mockResolvedValue("interview-abc123");

      const result = await cancelInterview("interview-abc123", user);

      expect(result).toBe("interview-abc123");
      expect(interviewsRepository.getInterviewById).toHaveBeenCalledWith(
        "interview-abc123",
      );
      expect(interviewsRepository.updateInterview).toHaveBeenCalledWith(
        "interview-abc123",
        { status: "cancelled" },
      );
    });
  });
});
