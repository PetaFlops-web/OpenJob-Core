import i18next from "i18next";
import NotificationsRepository from "./notifications.repository.js";
import { AuthError, InvariantError, NotFoundError } from "../exceptions/index.js";

const getNotifications = async (userId, page = 1, limit = 10) => {
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const { rows, total } = await NotificationsRepository.getNotificationsByUser(userId, page, limit);

  return {
    notifications: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getUnreadCount = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const count = await NotificationsRepository.getUnreadCount(userId);
  return { unread_count: count };
};

const markAsRead = async (id, userId) => {
  if (!id) throw new NotFoundError(i18next.t("error.idRequired"));
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const notification = await NotificationsRepository.getNotificationById(id);
  if (!notification) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.notification") }));
  if (notification.user_id !== userId) throw new AuthError(i18next.t("error.notAuthorized", { resource: i18next.t("resource.notification") }));

  const updatedId = await NotificationsRepository.markAsRead(id);
  if (!updatedId) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.notification") }));

  return { id: updatedId };
};

const markAllAsRead = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const ids = await NotificationsRepository.markAllAsRead(userId);
  return { ids };
};

const deleteNotification = async (id, userId) => {
  if (!id) throw new NotFoundError(i18next.t("error.idRequired"));
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const notification = await NotificationsRepository.getNotificationById(id);
  if (!notification) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.notification") }));
  if (notification.user_id !== userId) throw new AuthError(i18next.t("error.notAuthorized", { resource: i18next.t("resource.notification") }));

  const deletedId = await NotificationsRepository.deleteNotification(id);
  if (!deletedId) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.notification") }));

  return { id: deletedId };
};

const getPreferences = async (userId) => {
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const preferences = await NotificationsRepository.getPreferences(userId);

  // Return defaults if no preferences set
  if (!preferences) {
    return {
      user_id: userId,
      email_application: true,
      email_interview: true,
      push_application: true,
      push_interview: true,
      websocket_enabled: true,
    };
  }

  return preferences;
};

const updatePreferences = async (userId, payload) => {
  if (!userId) throw new AuthError(i18next.t("error.authenticationRequired"));

  const preferences = await NotificationsRepository.upsertPreferences(userId, payload);
  if (!preferences) throw new InvariantError(i18next.t("error.failedToSave", { resource: i18next.t("resource.preferences") }));

  return preferences;
};

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
};
