import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setupMFAHandler,
  verifyMFAHandler,
  disableMFAHandler,
} from "../src/security/mfa.controller.js";
vi.mock("../src/security/mfa.service.js", () => ({
  setupMFA: vi.fn(),
  verifyMFA: vi.fn(),
  disableMFA: vi.fn(),
}));

import { setupMFA, verifyMFA, disableMFA } from "../src/security/mfa.service.js";

describe("MFA Controller", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "user-123" },
      validate: { token: "123456" },
      t: vi.fn((key, _opts) => {
        const map = {
          "success.updated": "MFA berhasil diperbarui",
          "success.deleted": "MFA berhasil dihapus",
        };
        return map[key] || key;
      }),
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("setupMFAHandler", () => {
    it("should return 200 with MFA setup result", async () => {
      const mockResult = { secret: "BASE32SECRET", otpauth_url: "otpauth://..." };
      setupMFA.mockResolvedValue(mockResult);

      await setupMFAHandler(req, res);

      expect(setupMFA).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "MFA berhasil diperbarui",
        data: mockResult,
      });
    });

    it("should return 500 on error", async () => {
      setupMFA.mockRejectedValue(new Error("DB error"));

      await setupMFAHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("verifyMFAHandler", () => {
    it("should call verifyMFA with user id, token, and mfa_token", async () => {
      verifyMFA.mockResolvedValue({ accessToken: "at", refreshToken: "rt" });

      await verifyMFAHandler(req, res);

      expect(verifyMFA).toHaveBeenCalledWith("user-123", "123456", null);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 on InvariantError", async () => {
      const err = new Error("Invalid token");
      err.name = "InvariantError";
      verifyMFA.mockRejectedValue(err);

      await verifyMFAHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("disableMFAHandler", () => {
    it("should return 200 on successful disable", async () => {
      disableMFA.mockResolvedValue(undefined);

      await disableMFAHandler(req, res);

      expect(disableMFA).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on error", async () => {
      disableMFA.mockRejectedValue(new Error("DB error"));

      await disableMFAHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
