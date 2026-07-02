import i18next from "i18next";
import InterviewsRepository from "./interviews.repository.js";
import {
  AuthError,
  InvariantError,
  NotFoundError,
} from "../exceptions/index.js";
import { sendMessage } from "../export/producer.js";
import { getIO } from "../ws/websocket.js";
import logger from "../utils/logger.js";
import { createRealtimePayload } from "../ws/realtime-event.js";

const scheduleInterview = async (payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const conflicts = await InterviewsRepository.checkConflicts(
    payload.company_id,
    payload.scheduled_at,
    payload.duration_minutes || 60,
    null,
  );

  if (conflicts > 0) {
    throw new InvariantError(i18next.t("error.interviewConflict"));
  }

  const id = await InterviewsRepository.addInterview({
    ...payload,
    created_by: user.id,
  });

  if (!id) throw new InvariantError(i18next.t("error.failedToSchedule", { resource: i18next.t("resource.interview") }));

  await sendMessage("interview_scheduled", {
    interview_id: id,
    user_id: payload.user_id,
    company_id: payload.company_id,
    job_id: payload.job_id,
    scheduled_at: payload.scheduled_at,
  });

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${payload.user_id}`).emit("interview_scheduled", createRealtimePayload({
      id,
      type: "interview_scheduled",
      message: "Interview scheduled successfully",
      interview_id: id,
      job_id: payload.job_id,
      scheduled_at: payload.scheduled_at,
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  const reminderOffsets = [
    { type: "24h", minutes: 24 * 60 },
    { type: "1h", minutes: 60 },
    { type: "15m", minutes: 15 },
  ];

  for (const offset of reminderOffsets) {
    await InterviewsRepository.addReminder({
      interview_id: id,
      reminder_type: offset.type,
    });
  }

  return id;
};

const rescheduleInterview = async (id, payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));
  if (!id) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const interview = await InterviewsRepository.getInterviewById(id);
  if (!interview) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  if (payload.scheduled_at) {
    const conflicts = await InterviewsRepository.checkConflicts(
      interview.company_id,
      payload.scheduled_at,
      payload.duration_minutes || interview.duration_minutes,
      id,
    );

    if (conflicts > 0) {
      throw new InvariantError(i18next.t("error.interviewConflict"));
    }
  }

  const updatedId = await InterviewsRepository.updateInterview(id, payload);
  if (!updatedId) throw new InvariantError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.interview") }));

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${interview.user_id}`).emit("interview_reminder", createRealtimePayload({
      id,
      type: "interview_reminder",
      message: "Interview rescheduled",
      interview_id: id,
      updated_fields: payload,
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return updatedId;
};

const cancelInterview = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));
  if (!id) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const interview = await InterviewsRepository.getInterviewById(id);
  if (!interview) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const updatedId = await InterviewsRepository.updateInterview(id, {
    status: "cancelled",
  });

  if (!updatedId) throw new InvariantError(i18next.t("error.failedToCancel", { resource: i18next.t("resource.interview") }));

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${interview.user_id}`).emit("interview_reminder", createRealtimePayload({
      id,
      type: "interview_reminder",
      message: "Interview cancelled",
      interview_id: id,
      status: "cancelled",
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return updatedId;
};

const getInterviewById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));
  if (!id) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const interview = await InterviewsRepository.getInterviewById(id);
  if (!interview) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  return interview;
};

const getCompanyInterviews = async (companyId, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const interviews = await InterviewsRepository.getInterviewsByCompany(companyId);
  return interviews;
};

const getUserInterviews = async (userId, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const interviews = await InterviewsRepository.getInterviewsByUser(userId);
  return interviews;
};

const completeInterview = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const interview = await InterviewsRepository.getInterviewById(id);
  if (!interview) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const updatedId = await InterviewsRepository.completeInterview(id);
  if (!updatedId) throw new InvariantError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.interview") }));

  // Emit WebSocket event to applicant
  try {
    const io = getIO();
    io.to(`user:${interview.user_id}`).emit("interview_reminder", createRealtimePayload({
      id,
      type: "interview_reminder",
      message: "Interview completed",
      interview_id: id,
      status: "completed",
    }));
  } catch (err) {
    logger.warn("WebSocket emit failed:", err.message);
  }

  return updatedId;
};

const markNoShow = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.unauthorized"));

  const interview = await InterviewsRepository.getInterviewById(id);
  if (!interview) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));

  const updatedId = await InterviewsRepository.markNoShow(id);
  if (!updatedId) throw new InvariantError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.interview") }));

  return updatedId;
};

export {
  scheduleInterview,
  rescheduleInterview,
  cancelInterview,
  getInterviewById,
  getCompanyInterviews,
  getUserInterviews,
  completeInterview,
  markNoShow,
};
