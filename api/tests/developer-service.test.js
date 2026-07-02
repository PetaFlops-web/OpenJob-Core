import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
} from "../src/developer/developer.service.js";

// Mock the repository module
vi.mock("../src/developer/developer.repository.js", () => ({
  default: {
    createApiKey: vi.fn(),
    getApiKeys: vi.fn(),
    getApiKeyById: vi.fn(),
    revokeApiKey: vi.fn(),
    rotateApiKey: vi.fn(),
  },
}));

// Mock i18next as identity function
vi.mock("i18next", () => ({
  default: { t: (key) => key },
}));

import DeveloperRepository from "../src/developer/developer.repository.js";

describe("Developer Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateApiKey", () => {
    it("should generate an API key successfully", async () => {
      const companyId = "company-123";
      const name = "My Key";
      const permissions = ["read", "write"];
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.createApiKey.mockResolvedValue("apikey-abc123");

      const result = await generateApiKey(companyId, name, permissions, user);

      expect(result.id).toBe("apikey-abc123");
      expect(result.key).toMatch(/^ob_/);
      expect(result.prefix).toBe("ob");
      expect(result.name).toBe("My Key");
      expect(DeveloperRepository.createApiKey).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: companyId,
          name,
          key_prefix: "ob",
          permissions,
        })
      );
    });

    it("should throw AuthError when no user is provided", async () => {
      await expect(
        generateApiKey("company-123", "My Key", ["read"], null)
      ).rejects.toThrow("error.unauthorized");
    });
  });

  describe("listApiKeys", () => {
    it("should return list of API keys successfully", async () => {
      const companyId = "company-123";
      const user = { id: "user-1", email: "test@example.com" };
      const mockKeys = [
        { id: "apikey-1", name: "Key 1", key_prefix: "ob" },
        { id: "apikey-2", name: "Key 2", key_prefix: "ob" },
      ];

      DeveloperRepository.getApiKeys.mockResolvedValue(mockKeys);

      const result = await listApiKeys(companyId, user);

      expect(result).toEqual(mockKeys);
      expect(DeveloperRepository.getApiKeys).toHaveBeenCalledWith(companyId);
    });

    it("should throw AuthError when no user is provided", async () => {
      await expect(listApiKeys("company-123", null)).rejects.toThrow(
        "error.unauthorized"
      );
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke an API key successfully", async () => {
      const id = "apikey-123";
      const companyId = "company-123";
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue({
        id,
        name: "My Key",
        key_prefix: "ob",
      });
      DeveloperRepository.revokeApiKey.mockResolvedValue(id);

      const result = await revokeApiKey(id, companyId, user);

      expect(result).toBe(id);
      expect(DeveloperRepository.getApiKeyById).toHaveBeenCalledWith(id);
      expect(DeveloperRepository.revokeApiKey).toHaveBeenCalledWith(
        id,
        companyId
      );
    });

    it("should throw AuthError when no user is provided", async () => {
      await expect(
        revokeApiKey("apikey-123", "company-123", null)
      ).rejects.toThrow("error.unauthorized");
    });

    it("should throw NotFoundError when API key is not found", async () => {
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue(null);

      await expect(
        revokeApiKey("apikey-123", "company-123", user)
      ).rejects.toThrow("error.notFound");
    });

    it("should throw NotFoundError when revoke operation fails", async () => {
      const id = "apikey-123";
      const companyId = "company-123";
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue({
        id,
        name: "My Key",
        key_prefix: "ob",
      });
      DeveloperRepository.revokeApiKey.mockResolvedValue(null);

      await expect(revokeApiKey(id, companyId, user)).rejects.toThrow(
        "error.notFoundOrRevoked"
      );
    });
  });

  describe("rotateApiKey", () => {
    it("should rotate an API key successfully", async () => {
      const id = "apikey-123";
      const companyId = "company-123";
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue({
        id,
        name: "My Key",
        key_prefix: "ob",
      });
      DeveloperRepository.rotateApiKey.mockResolvedValue(id);

      const result = await rotateApiKey(id, companyId, user);

      expect(result.id).toBe(id);
      expect(result.key).toMatch(/^ob_/);
      expect(result.prefix).toBe("ob");
      expect(result.name).toBe("My Key");
      expect(DeveloperRepository.getApiKeyById).toHaveBeenCalledWith(id);
      expect(DeveloperRepository.rotateApiKey).toHaveBeenCalledWith(
        id,
        companyId,
        expect.any(String),
        "ob"
      );
    });

    it("should throw AuthError when no user is provided", async () => {
      await expect(
        rotateApiKey("apikey-123", "company-123", null)
      ).rejects.toThrow("error.unauthorized");
    });

    it("should throw NotFoundError when API key is not found", async () => {
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue(null);

      await expect(
        rotateApiKey("apikey-123", "company-123", user)
      ).rejects.toThrow("error.notFound");
    });

    it("should throw NotFoundError when rotate operation fails", async () => {
      const id = "apikey-123";
      const companyId = "company-123";
      const user = { id: "user-1", email: "test@example.com" };

      DeveloperRepository.getApiKeyById.mockResolvedValue({
        id,
        name: "My Key",
        key_prefix: "ob",
      });
      DeveloperRepository.rotateApiKey.mockResolvedValue(null);

      await expect(rotateApiKey(id, companyId, user)).rejects.toThrow(
        "error.notFound"
      );
    });
  });
});
