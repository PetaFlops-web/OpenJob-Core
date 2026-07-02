import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setupMFA,
  verifyMFA,
  disableMFA,
} from "../src/security/mfa.service.js";

vi.mock("i18next", () => ({
  default: {
    t: vi.fn((key, _options) => {
      const map = {
        "error.mfaNotSetUp": "MFA not set up",
        "error.invalidToken": "Invalid token",
      };
      return map[key] || key;
    }),
  },
  t: vi.fn((key) => key),
}));

vi.mock("../src/security/token-manager.js", () => ({
  default: {
    generateAccessToken: vi.fn(() => "access-token"),
    generateRefreshToken: vi.fn(() => "refresh-token"),
    verifyMFAToken: vi.fn(() => ({ id: "user-123", purpose: "mfa_verify" })),
  },
}));

vi.mock("../src/users/user.repository.js", () => ({
  default: {
    getUserById: vi.fn(() => ({ id: "user-123", role: "jobseeker" })),
    updateMfaEnabled: vi.fn(),
  },
}));

vi.mock("../src/security/mfa.repository.js", () => ({
  default: {
    getMFASettings: vi.fn(),
    upsertMFASettings: vi.fn(),
    disableMFA: vi.fn(),
  },
}));

vi.mock("speakeasy", () => ({
  default: {
    generateSecret: vi.fn(),
    totp: {
      verify: vi.fn(),
    },
  },
}));

import mfaRepository from "../src/security/mfa.repository.js";
import speakeasy from "speakeasy";

describe("MFA Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setupMFA", () => {
    it("should generate secret, store in DB, and return secret", async () => {
      const mockSecret = {
        base32: "JBSWY3DPEHPK3PXP",
        otpauth_url: "otpauth://totp/OpenJob:user-123?secret=JBSWY3DPEHPK3PXP",
      };

      speakeasy.generateSecret.mockReturnValue(mockSecret);
      mfaRepository.upsertMFASettings.mockResolvedValue("user-123");

      const result = await setupMFA("user-123");

      expect(result).toEqual({
        secret: "JBSWY3DPEHPK3PXP",
        otpauth_url: "otpauth://totp/OpenJob:user-123?secret=JBSWY3DPEHPK3PXP",
      });
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: "OpenJob:user-123",
      });
      expect(mfaRepository.upsertMFASettings).toHaveBeenCalledWith(
        "user-123",
        {
          secret: "JBSWY3DPEHPK3PXP",
          enabled: false,
          backup_codes: null,
        },
      );
    });
  });

  describe("verifyMFA", () => {
    it("should verify token and return JWT tokens", async () => {
      const mockSettings = {
        user_id: "user-123",
        secret: "JBSWY3DPEHPK3PXP",
        enabled: false,
        backup_codes: null,
      };

      mfaRepository.getMFASettings.mockResolvedValue(mockSettings);
      speakeasy.totp.verify.mockReturnValue(true);
      mfaRepository.upsertMFASettings.mockResolvedValue("user-123");

      const result = await verifyMFA("user-123", "123456");

      expect(result).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" });
      expect(mfaRepository.getMFASettings).toHaveBeenCalledWith("user-123");
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: "JBSWY3DPEHPK3PXP",
        encoding: "base32",
        token: "123456",
        window: 1,
      });
      expect(mfaRepository.upsertMFASettings).toHaveBeenCalledWith(
        "user-123",
        {
          secret: "JBSWY3DPEHPK3PXP",
          enabled: true,
          backup_codes: null,
        },
      );
    });

    it("should throw InvariantError when token is invalid", async () => {
      const mockSettings = {
        user_id: "user-123",
        secret: "JBSWY3DPEHPK3PXP",
        enabled: false,
        backup_codes: null,
      };

      mfaRepository.getMFASettings.mockResolvedValue(mockSettings);
      speakeasy.totp.verify.mockReturnValue(false);

      await expect(verifyMFA("user-123", "000000")).rejects.toThrow(
        "Invalid token",
      );
      expect(mfaRepository.upsertMFASettings).not.toHaveBeenCalled();
    });

    it("should throw InvariantError when MFA is not set up", async () => {
      mfaRepository.getMFASettings.mockResolvedValue(null);

      await expect(verifyMFA("user-123", "123456")).rejects.toThrow(
        "MFA not set up",
      );
      expect(speakeasy.totp.verify).not.toHaveBeenCalled();
    });
  });

  describe("disableMFA", () => {
    it("should delete MFA settings successfully", async () => {
      mfaRepository.disableMFA.mockResolvedValue(undefined);

      await disableMFA("user-123");

      expect(mfaRepository.disableMFA).toHaveBeenCalledWith("user-123");
    });
  });
});
