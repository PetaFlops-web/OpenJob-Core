import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addAuthentication,
  refreshTokenAuth,
  deleteRefreshToken,
} from "../src/authentications/authentications.service.js";

// Mock dependencies
vi.mock("../src/authentications/authentication.repository.js", () => ({
  default: {
    verifyUserCredential: vi.fn(),
    token: vi.fn(),
    verifyRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
  },
}));

vi.mock("../src/users/user.repository.js", () => ({
  default: {
    checkUserEmail: vi.fn(),
    getUserById: vi.fn(),
  },
}));

vi.mock("../src/security/token-manager.js", () => ({
  default: {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    generateMFAToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  },
}));

vi.mock("i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import AuthenticationRepository from "../src/authentications/authentication.repository.js";
import userRepository from "../src/users/user.repository.js";
import TokenManager from "../src/security/token-manager.js";

describe("Authentications Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("addAuthentication", () => {
    it("should return accessToken and refreshToken on successful login", async () => {
      const payload = { email: "john@example.com", password: "secret123" };
      const mockUser = { id: "user-1", email: "john@example.com", mfa_enabled: false };
      const mockCredential = { id: "user-1", role: "user" };
      const mockAccessToken = "access-token-abc";
      const mockRefreshToken = "refresh-token-xyz";

      userRepository.checkUserEmail.mockResolvedValue(mockUser);
      AuthenticationRepository.verifyUserCredential.mockResolvedValue(
        mockCredential,
      );
      TokenManager.generateAccessToken.mockReturnValue(mockAccessToken);
      TokenManager.generateRefreshToken.mockReturnValue(mockRefreshToken);
      AuthenticationRepository.token.mockResolvedValue(undefined);

      const result = await addAuthentication(payload);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(userRepository.checkUserEmail).toHaveBeenCalledWith(
        "john@example.com",
      );
      expect(
        AuthenticationRepository.verifyUserCredential,
      ).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "secret123",
      });
      expect(TokenManager.generateAccessToken).toHaveBeenCalledWith({
        id: "user-1",
        role: "user",
      });
      expect(TokenManager.generateRefreshToken).toHaveBeenCalledWith({
        id: "user-1",
      });
      expect(AuthenticationRepository.token).toHaveBeenCalledWith(
        mockRefreshToken,
      );
    });

    it("should return mfa_required when user has MFA enabled", async () => {
      const payload = { email: "john@example.com", password: "secret123" };
      const mockUser = { id: "user-1", email: "john@example.com", mfa_enabled: true };
      const mockCredential = { id: "user-1", role: "user" };
      const mockMfaToken = "mfa-token-abc";

      userRepository.checkUserEmail.mockResolvedValue(mockUser);
      AuthenticationRepository.verifyUserCredential.mockResolvedValue(
        mockCredential,
      );
      TokenManager.generateMFAToken.mockReturnValue(mockMfaToken);

      const result = await addAuthentication(payload);

      expect(result).toEqual({
        mfa_required: true,
        mfa_token: mockMfaToken,
      });
      expect(TokenManager.generateMFAToken).toHaveBeenCalledWith({
        id: "user-1",
        purpose: "mfa_verify",
      });
      expect(TokenManager.generateAccessToken).not.toHaveBeenCalled();
      expect(TokenManager.generateRefreshToken).not.toHaveBeenCalled();
      expect(AuthenticationRepository.token).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user is not found", async () => {
      const payload = { email: "missing@example.com", password: "secret123" };

      userRepository.checkUserEmail.mockResolvedValue(null);

      await expect(addAuthentication(payload)).rejects.toThrow("error.notFound");
      expect(userRepository.checkUserEmail).toHaveBeenCalledWith(
        "missing@example.com",
      );
      expect(
        AuthenticationRepository.verifyUserCredential,
      ).not.toHaveBeenCalled();
    });

    it("should throw AuthError when credentials are invalid", async () => {
      const payload = { email: "john@example.com", password: "wrong" };
      const mockUser = { id: "user-1", email: "john@example.com", mfa_enabled: false };

      userRepository.checkUserEmail.mockResolvedValue(mockUser);
      AuthenticationRepository.verifyUserCredential.mockResolvedValue(null);

      await expect(addAuthentication(payload)).rejects.toThrow(
        "error.invalidCredentials",
      );
      expect(
        AuthenticationRepository.verifyUserCredential,
      ).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "wrong",
      });
      expect(TokenManager.generateAccessToken).not.toHaveBeenCalled();
      expect(TokenManager.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("refreshTokenAuth", () => {
    it("should return a new accessToken on successful refresh", async () => {
      const refreshToken = "refresh-token-xyz";
      const mockDecoded = { id: "user-1" };
      const mockUser = { id: "user-1", role: "admin" };
      const mockAccessToken = "new-access-token";

      AuthenticationRepository.verifyRefreshToken.mockResolvedValue(true);
      TokenManager.verifyRefreshToken.mockReturnValue(mockDecoded);
      userRepository.getUserById.mockResolvedValue(mockUser);
      TokenManager.generateAccessToken.mockReturnValue(mockAccessToken);

      const result = await refreshTokenAuth(refreshToken);

      expect(result).toEqual({ accessToken: mockAccessToken });
      expect(
        AuthenticationRepository.verifyRefreshToken,
      ).toHaveBeenCalledWith(refreshToken);
      expect(TokenManager.verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(userRepository.getUserById).toHaveBeenCalledWith("user-1");
      expect(TokenManager.generateAccessToken).toHaveBeenCalledWith({
        id: "user-1",
        role: "admin",
      });
    });

    it("should throw AuthError when refresh token is invalid (repository)", async () => {
      const refreshToken = "bad-token";

      AuthenticationRepository.verifyRefreshToken.mockResolvedValue(null);

      await expect(refreshTokenAuth(refreshToken)).rejects.toThrow(
        "error.invalidRefreshToken",
      );
      expect(TokenManager.verifyRefreshToken).not.toHaveBeenCalled();
      expect(userRepository.getUserById).not.toHaveBeenCalled();
    });

    it("should throw AuthError when user is not found after token verification", async () => {
      const refreshToken = "refresh-token-xyz";
      const mockDecoded = { id: "user-deleted" };

      AuthenticationRepository.verifyRefreshToken.mockResolvedValue(true);
      TokenManager.verifyRefreshToken.mockReturnValue(mockDecoded);
      userRepository.getUserById.mockResolvedValue(null);

      await expect(refreshTokenAuth(refreshToken)).rejects.toThrow(
        "error.invalidRefreshToken",
      );
      expect(userRepository.getUserById).toHaveBeenCalledWith("user-deleted");
      expect(TokenManager.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("deleteRefreshToken", () => {
    it("should delete refresh token and return result on success", async () => {
      const refreshToken = "refresh-token-xyz";
      const deleteResult = { deleted: true };

      AuthenticationRepository.verifyRefreshToken.mockResolvedValue(true);
      AuthenticationRepository.deleteRefreshToken.mockResolvedValue(
        deleteResult,
      );

      const result = await deleteRefreshToken(refreshToken);

      expect(result).toEqual(deleteResult);
      expect(
        AuthenticationRepository.verifyRefreshToken,
      ).toHaveBeenCalledWith(refreshToken);
      expect(
        AuthenticationRepository.deleteRefreshToken,
      ).toHaveBeenCalledWith(refreshToken);
    });

    it("should throw AuthError when refresh token is invalid", async () => {
      const refreshToken = "bad-token";

      AuthenticationRepository.verifyRefreshToken.mockResolvedValue(null);

      await expect(deleteRefreshToken(refreshToken)).rejects.toThrow(
        "error.invalidRefreshToken",
      );
      expect(
        AuthenticationRepository.deleteRefreshToken,
      ).not.toHaveBeenCalled();
    });
  });
});
