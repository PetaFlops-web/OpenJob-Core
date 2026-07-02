import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProfileUserById,
  getProfileUserApplications,
  getProfileUserBookmarkedJobs,
  getProfileUserInterviews,
  getProfileInterviewById,
  updateProfile,
} from "../src/profile/profile.service.js";

// Mock the repository module
vi.mock("../src/profile/profile.repository.js", () => ({
  default: {
    getProfileByUserId: vi.fn(),
    getProfileUserApplications: vi.fn(),
    getProfileUserBookmarkedJobs: vi.fn(),
    getProfileUserInterviews: vi.fn(),
    getProfileInterviewById: vi.fn(),
    getProfileBookmarkedJobs: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: { t: (key) => key },
}));

import ProfileRepository from "../src/profile/profile.repository.js";

describe("Profile Service", () => {
  const mockUserId = "user-abc123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfileUserById", () => {
    it("should return user profile when found", async () => {
      const mockUser = {
        id: "user-abc123",
        name: "John Doe",
        email: "john@example.com",
        role: "jobseeker",
        phone: "+1234567890",
        location: "New York",
        bio: "Software developer",
        avatar: "avatar.png",
        mfa_enabled: false,
      };

      ProfileRepository.getProfileByUserId.mockResolvedValue(mockUser);

      const result = await getProfileUserById(mockUserId);

      expect(result).toEqual(mockUser);
      expect(ProfileRepository.getProfileByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw NotFoundError when user not found", async () => {
      ProfileRepository.getProfileByUserId.mockResolvedValue(null);

      await expect(getProfileUserById(mockUserId)).rejects.toThrow();
    });
  });

  describe("getProfileUserApplications", () => {
    it("should return applications when found", async () => {
      const mockApplications = [
        { id: "app-1", jobId: "job-1", status: "pending" },
        { id: "app-2", jobId: "job-2", status: "accepted" },
      ];

      ProfileRepository.getProfileUserApplications.mockResolvedValue(mockApplications);

      const result = await getProfileUserApplications(mockUserId);

      expect(result).toEqual(mockApplications);
      expect(ProfileRepository.getProfileUserApplications).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw NotFoundError when applications not found", async () => {
      ProfileRepository.getProfileUserApplications.mockResolvedValue(null);

      await expect(getProfileUserApplications(mockUserId)).rejects.toThrow();
    });
  });

  describe("getProfileUserBookmarkedJobs", () => {
    it("should return bookmarked jobs when found", async () => {
      const mockBookmarks = [
        { id: "bm-1", jobId: "job-1" },
        { id: "bm-2", jobId: "job-2" },
      ];

      ProfileRepository.getProfileBookmarkedJobs.mockResolvedValue(mockBookmarks);

      const result = await getProfileUserBookmarkedJobs(mockUserId);

      expect(result).toEqual(mockBookmarks);
      expect(ProfileRepository.getProfileBookmarkedJobs).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw NotFoundError when bookmarked jobs not found", async () => {
      ProfileRepository.getProfileBookmarkedJobs.mockResolvedValue(null);

      await expect(getProfileUserBookmarkedJobs(mockUserId)).rejects.toThrow();
    });
  });

  describe("getProfileUserInterviews", () => {
    it("should return interviews when found", async () => {
      const mockInterviews = [
        { id: "int-1", jobId: "job-1", scheduledAt: "2026-07-01T10:00:00Z" },
        { id: "int-2", jobId: "job-2", scheduledAt: "2026-07-05T14:00:00Z" },
      ];

      ProfileRepository.getProfileUserInterviews.mockResolvedValue(mockInterviews);

      const result = await getProfileUserInterviews(mockUserId);

      expect(result).toEqual(mockInterviews);
      expect(ProfileRepository.getProfileUserInterviews).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw NotFoundError when interviews not found", async () => {
      ProfileRepository.getProfileUserInterviews.mockResolvedValue(null);

      await expect(getProfileUserInterviews(mockUserId)).rejects.toThrow();
    });
  });

  describe("getProfileInterviewById", () => {
    it("should return interview when found", async () => {
      const mockInterview = {
        id: "int-1",
        jobId: "job-1",
        userId: mockUserId,
        scheduledAt: "2026-07-01T10:00:00Z",
        status: "scheduled",
      };

      ProfileRepository.getProfileInterviewById.mockResolvedValue(mockInterview);

      const result = await getProfileInterviewById("int-1", mockUserId);

      expect(result).toEqual(mockInterview);
      expect(ProfileRepository.getProfileInterviewById).toHaveBeenCalledWith("int-1", mockUserId);
    });

    it("should throw NotFoundError when interview not found", async () => {
      ProfileRepository.getProfileInterviewById.mockResolvedValue(null);

      await expect(getProfileInterviewById("nonexistent", mockUserId)).rejects.toThrow();
    });
  });

  describe("updateProfile", () => {
    it("should return updated user when successful", async () => {
      const updateData = { name: "Jane Doe", bio: "Updated bio" };
      const mockUpdatedUser = {
        id: mockUserId,
        name: "Jane Doe",
        email: "john@example.com",
        bio: "Updated bio",
      };

      ProfileRepository.updateProfile.mockResolvedValue(mockUpdatedUser);

      const result = await updateProfile(mockUserId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(ProfileRepository.updateProfile).toHaveBeenCalledWith(mockUserId, updateData);
    });

    it("should throw NotFoundError when user not found", async () => {
      ProfileRepository.updateProfile.mockResolvedValue(null);

      await expect(updateProfile(mockUserId, { name: "Test" })).rejects.toThrow();
    });
  });
});
