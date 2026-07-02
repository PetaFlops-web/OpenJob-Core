import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSessionsHandler,
  revokeSessionHandler,
  revokeOtherSessionsHandler,
} from "../src/security/session.controller.js";

vi.mock("../src/security/session.service.js", () => ({
  getSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
}));

import { getSessions, revokeSession, revokeOtherSessions } from "../src/security/session.service.js";

describe("Session Controller", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "user-123" },
      params: { id: "session-abc" },
      headers: { "x-session-id": "session-current" },
      t: vi.fn((key, opts) => {
        const map = {
          "success.retrieved": "{{resource}} retrieved successfully",
          "success.deleted": "{{resource}} deleted successfully",
          "resource.session": "Session",
        };
        const val = map[key];
        if (val && opts) return val.replace("{{resource}}", opts.resource);
        return val || key;
      }),
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getSessionsHandler", () => {
    it("should return 200 with sessions", async () => {
      const mockSessions = [{ id: "session-1" }, { id: "session-2" }];
      getSessions.mockResolvedValue(mockSessions);

      await getSessionsHandler(req, res);

      expect(getSessions).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Session retrieved successfully",
        data: { sessions: mockSessions },
      });
    });

    it("should return 500 on error", async () => {
      getSessions.mockRejectedValue(new Error("DB error"));

      await getSessionsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("revokeSessionHandler", () => {
    it("should return 200 on successful revoke", async () => {
      revokeSession.mockResolvedValue("session-abc");

      await revokeSessionHandler(req, res);

      expect(revokeSession).toHaveBeenCalledWith("session-abc", "user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Session deleted successfully",
      });
    });

    it("should return 404 when session not found", async () => {
      revokeSession.mockRejectedValue({ name: "NotFoundError", message: "not found" });

      await revokeSessionHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("revokeOtherSessionsHandler", () => {
    it("should return 200 on success", async () => {
      revokeOtherSessions.mockResolvedValue(undefined);

      await revokeOtherSessionsHandler(req, res);

      expect(revokeOtherSessions).toHaveBeenCalledWith("user-123", "session-current");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on error", async () => {
      revokeOtherSessions.mockRejectedValue(new Error("DB error"));

      await revokeOtherSessionsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
