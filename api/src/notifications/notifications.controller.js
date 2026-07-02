import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} from "./notifications.service.js";
import response from "../utils/response.js";

const getNotificationsHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const result = await getNotifications(userId, parseInt(page, 10), parseInt(limit, 10));
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const getUnreadCountHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUnreadCount(userId);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const markAsReadHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await markAsRead(id, userId);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const markAllAsReadHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllAsRead(userId);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const deleteNotificationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteNotification(id, userId);
    return response(res, 200, req.t("success.deleted", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const getPreferencesHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getPreferences(userId);
    return response(res, 200, req.t("success.retrieved", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

const updatePreferencesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.validate;

    const result = await updatePreferences(userId, payload);
    return response(res, 200, req.t("success.updated", { resource: req.t("resource.notification") }), result);
  } catch (error) {
    const s = error.statusCode || 500; return response(res, s, s === 500 ? req.t("error.internal") : error.message, null);
  }
};

export {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
};
