import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  updatePreferences,
} from "../src/notifications/notifications.service.js";

// Mock the repository module
vi.mock("../src/notifications/notifications.repository.js", () => ({
  default: {
    getNotificationsByUser: vi.fn(),
    getUnreadCount: vi.fn(),
    getNotificationById: vi.fn(),
    markAsRead: vi.fn(),
    upsertPreferences: vi.fn(),
  },
}));

import notificationsRepository from "../src/notifications/notifications.repository.js";

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should return paginated notifications", async () => {
      const mockRows = [
        { id: "notif-1", title: "New application", read: false },
        { id: "notif-2", title: "Interview reminder", read: true },
      ];
      const mockTotal = 25;

      notificationsRepository.getNotificationsByUser.mockResolvedValue({
        rows: mockRows,
        total: mockTotal,
      });

      const result = await getNotifications("user-123", 2, 10);

      expect(result).toEqual({
        notifications: mockRows,
        pagination: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });
      expect(
        notificationsRepository.getNotificationsByUser,
      ).toHaveBeenCalledWith("user-123", 2, 10);
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      notificationsRepository.getUnreadCount.mockResolvedValue(7);

      const result = await getUnreadCount("user-123");

      expect(result).toEqual({ unread_count: 7 });
      expect(notificationsRepository.getUnreadCount).toHaveBeenCalledWith(
        "user-123",
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read successfully", async () => {
      const mockNotification = {
        id: "notif-abc123",
        user_id: "user-123",
        title: "Test notification",
        read: false,
      };

      notificationsRepository.getNotificationById.mockResolvedValue(
        mockNotification,
      );
      notificationsRepository.markAsRead.mockResolvedValue("notif-abc123");

      const result = await markAsRead("notif-abc123", "user-123");

      expect(result).toEqual({ id: "notif-abc123" });
      expect(notificationsRepository.getNotificationById).toHaveBeenCalledWith(
        "notif-abc123",
      );
      expect(notificationsRepository.markAsRead).toHaveBeenCalledWith(
        "notif-abc123",
      );
    });
  });

  describe("updatePreferences", () => {
    it("should upsert notification preferences successfully", async () => {
      const payload = {
        email_application: true,
        email_interview: false,
        push_application: true,
        push_interview: true,
        websocket_enabled: true,
      };

      notificationsRepository.upsertPreferences.mockResolvedValue({
        user_id: "user-123",
        ...payload,
      });

      const result = await updatePreferences("user-123", payload);

      expect(result).toEqual({
        user_id: "user-123",
        ...payload,
      });
      expect(notificationsRepository.upsertPreferences).toHaveBeenCalledWith(
        "user-123",
        payload,
      );
    });
  });
});
