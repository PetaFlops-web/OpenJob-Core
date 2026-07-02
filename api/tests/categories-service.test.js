import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addCategory,
  updateCategoryById,
  deleteCategoryById,
  getAllCategories,
  getCategoryById,
} from "../src/categories/categories.service.js";

// Mock the repository module
vi.mock("../src/categories/categories.repository.js", () => ({
  default: {
    addNewCategory: vi.fn(),
    updateCategoryById: vi.fn(),
    deleteCategoryById: vi.fn(),
    getAllCategories: vi.fn(),
    getCategoryById: vi.fn(),
  },
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: { t: (key) => key },
}));

import categoriesRepository from "../src/categories/categories.repository.js";

describe("Categories Service", () => {
  const mockUser = { id: "user-abc123", role: "admin" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addCategory", () => {
    it("should return the category id when user is provided and creation succeeds", async () => {
      const payload = { name: "Engineering" };
      categoriesRepository.addNewCategory.mockResolvedValue("category-123");

      const result = await addCategory(mockUser, payload);

      expect(result).toBe("category-123");
      expect(categoriesRepository.addNewCategory).toHaveBeenCalledWith(payload);
    });

    it("should throw AuthError when user is null", async () => {
      const payload = { name: "Engineering" };

      await expect(addCategory(null, payload)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.addNewCategory).not.toHaveBeenCalled();
    });

    it("should throw AuthError when user is undefined", async () => {
      const payload = { name: "Engineering" };

      await expect(addCategory(undefined, payload)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.addNewCategory).not.toHaveBeenCalled();
    });

    it("should throw InvariantError when addNewCategory returns null", async () => {
      const payload = { name: "Engineering" };
      categoriesRepository.addNewCategory.mockResolvedValue(null);

      await expect(addCategory(mockUser, payload)).rejects.toThrow("error.failedToCreate");
    });
  });

  describe("updateCategoryById", () => {
    it("should return the category id when update succeeds", async () => {
      const payload = { name: "Updated Engineering" };
      categoriesRepository.updateCategoryById.mockResolvedValue("category-123");

      const result = await updateCategoryById("category-123", payload, mockUser);

      expect(result).toBe("category-123");
      expect(categoriesRepository.updateCategoryById).toHaveBeenCalledWith("category-123", payload);
    });

    it("should throw AuthError when user is null", async () => {
      const payload = { name: "Updated Engineering" };

      await expect(updateCategoryById("category-123", payload, null)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.updateCategoryById).not.toHaveBeenCalled();
    });

    it("should throw AuthError when user is undefined", async () => {
      const payload = { name: "Updated Engineering" };

      await expect(updateCategoryById("category-123", payload, undefined)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.updateCategoryById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when updateCategoryById returns null", async () => {
      const payload = { name: "Updated Engineering" };
      categoriesRepository.updateCategoryById.mockResolvedValue(null);

      await expect(updateCategoryById("category-999", payload, mockUser)).rejects.toThrow("error.failedToUpdate");
    });
  });

  describe("deleteCategoryById", () => {
    it("should return the category id when deletion succeeds", async () => {
      categoriesRepository.deleteCategoryById.mockResolvedValue("category-123");

      const result = await deleteCategoryById("category-123", mockUser);

      expect(result).toBe("category-123");
      expect(categoriesRepository.deleteCategoryById).toHaveBeenCalledWith("category-123");
    });

    it("should throw AuthError when user is null", async () => {
      await expect(deleteCategoryById("category-123", null)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.deleteCategoryById).not.toHaveBeenCalled();
    });

    it("should throw AuthError when user is undefined", async () => {
      await expect(deleteCategoryById("category-123", undefined)).rejects.toThrow("error.invalidCredentials");
      expect(categoriesRepository.deleteCategoryById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when deleteCategoryById returns null", async () => {
      categoriesRepository.deleteCategoryById.mockResolvedValue(null);

      await expect(deleteCategoryById("category-999", mockUser)).rejects.toThrow("error.failedToDelete");
    });
  });

  describe("getAllCategories", () => {
    it("should return categories array when repository returns data", async () => {
      const mockCategories = [
        { id: "category-1", name: "Engineering" },
        { id: "category-2", name: "Design" },
      ];
      categoriesRepository.getAllCategories.mockResolvedValue(mockCategories);

      const result = await getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(categoriesRepository.getAllCategories).toHaveBeenCalled();
    });

    it("should throw NotFoundError when repository returns null", async () => {
      categoriesRepository.getAllCategories.mockResolvedValue(null);

      await expect(getAllCategories()).rejects.toThrow("error.failedToRetrieve");
    });
  });

  describe("getCategoryById", () => {
    it("should return the category when found", async () => {
      const mockCategory = { id: "category-123", name: "Engineering" };
      categoriesRepository.getCategoryById.mockResolvedValue(mockCategory);

      const result = await getCategoryById("category-123");

      expect(result).toEqual(mockCategory);
      expect(categoriesRepository.getCategoryById).toHaveBeenCalledWith("category-123");
    });

    it("should throw NotFoundError when category is not found", async () => {
      categoriesRepository.getCategoryById.mockResolvedValue(null);

      await expect(getCategoryById("category-999")).rejects.toThrow("error.notFound");
    });
  });
});
