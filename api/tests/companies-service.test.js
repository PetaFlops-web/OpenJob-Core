import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addCompany,
  putCompanyById,
  deleteCompanyById,
  getAllCompanies,
  getCompanyById,
  uploadLogo,
} from "../src/companies/companies.service.js";

// Mock the repository module
vi.mock("../src/companies/companies.repository.js", () => ({
  default: {
    addNewCompany: vi.fn(),
    updateCompanyById: vi.fn(),
    updateCompanyLogoById: vi.fn(),
    deleteCompanyById: vi.fn(),
    getAllCompanies: vi.fn(),
    getCompanyById: vi.fn(),
  },
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import CompaniesRepository from "../src/companies/companies.repository.js";

describe("Companies Service", () => {
  const mockUser = { id: "user-abc123", role: "employer" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addCompany", () => {
    it("should create a new company successfully", async () => {
      const payload = {
        name: "Tech Corp",
        description: "A technology company",
        location: "San Francisco",
      };

      CompaniesRepository.addNewCompany.mockResolvedValue("company-abc123");

      const result = await addCompany(payload, mockUser);

      expect(result).toBe("company-abc123");
      expect(CompaniesRepository.addNewCompany).toHaveBeenCalledWith({
        ...payload,
        user_id: mockUser.id,
      });
    });

    it("should throw AuthError if user is not authenticated", async () => {
      const payload = { name: "Tech Corp" };

      await expect(addCompany(payload, null)).rejects.toThrow();
    });

    it("should throw InvariantError if company creation fails", async () => {
      CompaniesRepository.addNewCompany.mockResolvedValue(null);

      await expect(addCompany({ name: "Tech Corp" }, mockUser)).rejects.toThrow();
    });
  });

  describe("putCompanyById", () => {
    it("should update a company successfully", async () => {
      const payload = {
        name: "Updated Tech Corp",
        description: "Updated description",
      };

      CompaniesRepository.updateCompanyById.mockResolvedValue("company-abc123");

      const result = await putCompanyById("company-abc123", payload, mockUser);

      expect(result).toBe("company-abc123");
      expect(CompaniesRepository.updateCompanyById).toHaveBeenCalledWith(
        "company-abc123",
        payload,
        mockUser,
      );
    });

    it("should throw NotFoundError if id is null", async () => {
      const payload = { name: "Tech Corp" };

      await expect(putCompanyById(null, payload, mockUser)).rejects.toThrow();
    });

    it("should throw NotFoundError if company not found", async () => {
      CompaniesRepository.updateCompanyById.mockResolvedValue(null);

      await expect(
        putCompanyById("non-existent", { name: "Tech Corp" }, mockUser),
      ).rejects.toThrow();
    });
  });

  describe("deleteCompanyById", () => {
    it("should delete a company successfully", async () => {
      CompaniesRepository.deleteCompanyById.mockResolvedValue("company-abc123");

      const result = await deleteCompanyById("company-abc123", mockUser);

      expect(result).toBe("company-abc123");
      expect(CompaniesRepository.deleteCompanyById).toHaveBeenCalledWith(
        "company-abc123",
      );
    });

    it("should throw AuthError if user is not authenticated", async () => {
      await expect(deleteCompanyById("company-abc123", null)).rejects.toThrow();
    });

    it("should throw NotFoundError if company not found", async () => {
      CompaniesRepository.deleteCompanyById.mockResolvedValue(null);

      await expect(
        deleteCompanyById("non-existent", mockUser),
      ).rejects.toThrow();
    });
  });

  describe("getAllCompanies", () => {
    it("should return all companies", async () => {
      const mockCompanies = [
        { id: "company-1", name: "Tech Corp" },
        { id: "company-2", name: "Startup Inc" },
      ];

      CompaniesRepository.getAllCompanies.mockResolvedValue(mockCompanies);

      const result = await getAllCompanies();

      expect(result).toEqual(mockCompanies);
      expect(CompaniesRepository.getAllCompanies).toHaveBeenCalled();
    });
  });

  describe("getCompanyById", () => {
    it("should return a company by id", async () => {
      const mockCompany = { id: "company-abc123", name: "Tech Corp" };

      CompaniesRepository.getCompanyById.mockResolvedValue(mockCompany);

      const result = await getCompanyById("company-abc123");

      expect(result).toEqual(mockCompany);
      expect(CompaniesRepository.getCompanyById).toHaveBeenCalledWith(
        "company-abc123",
      );
    });

    it("should throw NotFoundError if id is null", async () => {
      await expect(getCompanyById(null)).rejects.toThrow();
    });

    it("should throw NotFoundError if company not found", async () => {
      CompaniesRepository.getCompanyById.mockResolvedValue(null);

      await expect(getCompanyById("non-existent")).rejects.toThrow();
    });
  });

  describe("uploadLogo", () => {
    it("should persist logo_url and return snake_case logo_url", async () => {
      const mockCompany = { id: "company-1", user_id: mockUser.id };
      const mockFile = { filename: "logo-test.png" };

      CompaniesRepository.getCompanyById.mockResolvedValue(mockCompany);
      CompaniesRepository.updateCompanyLogoById.mockResolvedValue("company-1");

      const result = await uploadLogo("company-1", mockFile, mockUser);

      expect(CompaniesRepository.updateCompanyLogoById).toHaveBeenCalledWith(
        "company-1",
        "/companies/uploads/logo-test.png",
      );
      expect(result).toEqual({
        logo_url: "/companies/uploads/logo-test.png",
        companyId: "company-1",
      });
    });
  });
});
