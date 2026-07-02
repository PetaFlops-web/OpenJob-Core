import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { canJoinCompanyRoom, getSocketAuthToken } from "../src/ws/websocket.js";
import { createRealtimePayload } from "../src/ws/realtime-event.js";

describe("WebSocket V3 security hardening", () => {
  it("should only accept auth token from handshake.auth, not query", () => {
    const socketWithAuth = {
      handshake: {
        auth: { token: "auth-token" },
        query: { token: "query-token" },
      },
    };
    const socketWithQueryOnly = {
      handshake: {
        auth: {},
        query: { token: "query-token" },
      },
    };

    expect(getSocketAuthToken(socketWithAuth)).toBe("auth-token");
    expect(getSocketAuthToken(socketWithQueryOnly)).toBeUndefined();
  });

  it("should allow company room only for recruiter that owns the company", () => {
    const socket = { user: { id: "user-owner", role: "recruiter" } };

    expect(canJoinCompanyRoom(socket, { user_id: "user-owner" })).toBe(true);
    expect(canJoinCompanyRoom(socket, { user_id: "other-user" })).toBe(false);
    expect(canJoinCompanyRoom({ user: { id: "user-owner", role: "jobseeker" } }, { user_id: "user-owner" })).toBe(false);
    expect(canJoinCompanyRoom(socket, null)).toBe(false);
  });

  it("should not register a dynamic join_room listener", () => {
    const source = readFileSync("src/ws/websocket.js", "utf8");
    expect(source).not.toContain('socket.on("join_room"');
    expect(source).not.toContain("socket.on('join_room'");
  });

  it("should create standardized realtime payload while preserving legacy fields", () => {
    const payload = createRealtimePayload({
      id: "application-123",
      type: "application_created",
      message: "New application received",
      application_id: "application-123",
      job_id: "job-123",
      status: "pending",
    });

    expect(payload.id).toBe("application-123");
    expect(payload.type).toBe("application_created");
    expect(payload.message).toBe("New application received");
    expect(payload.created_at).toEqual(expect.any(String));
    expect(payload.data).toEqual({
      application_id: "application-123",
      job_id: "job-123",
      status: "pending",
    });
    expect(payload.application_id).toBe("application-123");
    expect(payload.job_id).toBe("job-123");
    expect(payload.status).toBe("pending");
  });
});
