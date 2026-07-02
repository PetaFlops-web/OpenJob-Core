import { describe, it, expect, vi, beforeEach } from "vitest";
import { addUser, getUserById } from "../src/users/user.service.js";

// Mock the repository module
vi.mock("../src/users/user.repository.js", () => ({
  default: {
    checkUserEmail: vi.fn(),
    addNewUser: vi.fn(),
    getUserById: vi.fn(),
  },
}));

import userRepository from "../src/users/user.repository.js";

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addUser", () => {
    it("should add a new user successfully", async () => {
      const payload = {
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
        role: "jobseeker",
      };

      userRepository.checkUserEmail.mockResolvedValue(null);
      userRepository.addNewUser.mockResolvedValue("user-abc123");

      const result = await addUser(payload);

      expect(result).toBe("user-abc123");
      expect(userRepository.checkUserEmail).toHaveBeenCalledWith("john@example.com");
      expect(userRepository.addNewUser).toHaveBeenCalledWith(payload);
    });

    it("should throw InvariantError if email already exists", async () => {
      const payload = {
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
        role: "jobseeker",
      };

      userRepository.checkUserEmail.mockResolvedValue({ id: "existing-user" });
      userRepository.addNewUser.mockResolvedValue("user-new");

      await expect(addUser(payload)).rejects.toThrow();
    });

    it("should throw InvariantError if required fields are missing", async () => {
      const payload = {
        name: "John Doe",
        // missing email, password, role
      };

      await expect(addUser(payload)).rejects.toThrow();
    });

    it("should throw InvariantError for empty fields", async () => {
      const payload = {
        name: "",
        email: "",
        password: "",
        role: "",
      };

      userRepository.checkUserEmail.mockResolvedValue(null);

      await expect(addUser(payload)).rejects.toThrow();
    });
  });

  describe("getUserById", () => {
    it("should return user if found", async () => {
      const mockUser = {
        id: "user-abc123",
        name: "John Doe",
        email: "john@example.com",
        role: "jobseeker",
      };

      userRepository.getUserById.mockResolvedValue(mockUser);

      const result = await getUserById("user-abc123");

      expect(result).toEqual(mockUser);
      expect(userRepository.getUserById).toHaveBeenCalledWith("user-abc123");
    });

    it("should throw NotFoundError if user not found", async () => {
      userRepository.getUserById.mockResolvedValue(null);

      await expect(getUserById("nonexistent")).rejects.toThrow();
    });
  });
});
