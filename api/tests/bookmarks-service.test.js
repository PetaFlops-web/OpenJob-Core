import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addNewBookmark,
  countBookmarksById,
  getBookmarkById,
  deleteBookmarkById,
} from "../src/bookmarks/bookmarks.service.js";

// Mock the bookmarks repository module
vi.mock("../src/bookmarks/bookmarks.repository.js", () => ({
  default: {
    addNewBookmark: vi.fn(),
    countBookmarksById: vi.fn(),
    getBookmarkById: vi.fn(),
    deleteBookmarkById: vi.fn(),
  },
}));

// Mock the jobs repository module
vi.mock("../src/jobs/jobs.repository.js", () => ({
  default: {
    getJobById: vi.fn(),
  },
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import bookmarksRepository from "../src/bookmarks/bookmarks.repository.js";
import jobsRepository from "../src/jobs/jobs.repository.js";

describe("Bookmarks Service", () => {
  const mockUser = { id: "user-abc123", role: "employee" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addNewBookmark", () => {
    it("should add a new bookmark and return the id", async () => {
      const jobId = "job-123";
      const userId = "user-abc123";
      const expectedId = "bookmark-456";

      jobsRepository.getJobById.mockResolvedValue({ id: jobId, title: "Test Job" });
      bookmarksRepository.addNewBookmark.mockResolvedValue(expectedId);

      const result = await addNewBookmark(jobId, userId, mockUser);

      expect(jobsRepository.getJobById).toHaveBeenCalledWith(jobId);
      expect(bookmarksRepository.addNewBookmark).toHaveBeenCalledWith({
        job_id: jobId,
        user_id: userId,
      });
      expect(result).toBe(expectedId);
    });

    it("should throw AuthError when user is null", async () => {
      await expect(addNewBookmark("job-123", "user-abc123", null)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw AuthError when user is undefined", async () => {
      await expect(addNewBookmark("job-123", "user-abc123", undefined)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw NotFoundError when job does not exist", async () => {
      jobsRepository.getJobById.mockResolvedValue(null);

      await expect(addNewBookmark("job-999", "user-abc123", mockUser)).rejects.toThrow("error.notFound");
      expect(jobsRepository.getJobById).toHaveBeenCalledWith("job-999");
    });
  });

  describe("countBookmarksById", () => {
    it("should return the bookmark count", async () => {
      const userId = "user-abc123";
      const expectedCount = { count: 5 };

      bookmarksRepository.countBookmarksById.mockResolvedValue(expectedCount);

      const result = await countBookmarksById(userId, mockUser);

      expect(bookmarksRepository.countBookmarksById).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedCount);
    });

    it("should throw AuthError when user is null", async () => {
      await expect(countBookmarksById("user-abc123", null)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw AuthError when user is undefined", async () => {
      await expect(countBookmarksById("user-abc123", undefined)).rejects.toThrow("error.invalidCredentials");
    });
  });

  describe("getBookmarkById", () => {
    it("should return the bookmark", async () => {
      const bookmarkId = "bookmark-456";
      const expectedBookmark = { id: bookmarkId, job_id: "job-123", user_id: "user-abc123" };

      bookmarksRepository.getBookmarkById.mockResolvedValue(expectedBookmark);

      const result = await getBookmarkById(bookmarkId, mockUser);

      expect(bookmarksRepository.getBookmarkById).toHaveBeenCalledWith(bookmarkId);
      expect(result).toBe(expectedBookmark);
    });

    it("should throw AuthError when user is null", async () => {
      await expect(getBookmarkById("bookmark-456", null)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw AuthError when user is undefined", async () => {
      await expect(getBookmarkById("bookmark-456", undefined)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw NotFoundError when bookmark does not exist", async () => {
      bookmarksRepository.getBookmarkById.mockResolvedValue(null);

      await expect(getBookmarkById("bookmark-999", mockUser)).rejects.toThrow("error.notFound");
      expect(bookmarksRepository.getBookmarkById).toHaveBeenCalledWith("bookmark-999");
    });
  });

  describe("deleteBookmarkById", () => {
    it("should delete the bookmark and return the result", async () => {
      const bookmarkId = "bookmark-456";
      const expectedResult = { id: bookmarkId, deleted: true };

      bookmarksRepository.deleteBookmarkById.mockResolvedValue(expectedResult);

      const result = await deleteBookmarkById(bookmarkId, mockUser);

      expect(bookmarksRepository.deleteBookmarkById).toHaveBeenCalledWith(bookmarkId);
      expect(result).toBe(expectedResult);
    });

    it("should throw AuthError when user is null", async () => {
      await expect(deleteBookmarkById("bookmark-456", null)).rejects.toThrow("error.invalidCredentials");
    });

    it("should throw AuthError when user is undefined", async () => {
      await expect(deleteBookmarkById("bookmark-456", undefined)).rejects.toThrow("error.invalidCredentials");
    });
  });
});
