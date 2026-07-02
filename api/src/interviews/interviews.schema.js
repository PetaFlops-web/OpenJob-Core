import Joi from "joi";

const scheduleInterviewSchema = Joi.object({
  application_id: Joi.string().required(),
  company_id: Joi.string().required(),
  user_id: Joi.string().required(),
  job_id: Joi.string().required(),
  scheduled_at: Joi.string().isoDate().required(),
  duration_minutes: Joi.number().integer().min(15).max(480).default(60),
  timezone: Joi.string().optional().default("Asia/Jakarta"),
  interview_type: Joi.string().valid("video", "phone", "in-person").optional(),
  location: Joi.string().optional(),
  meeting_link: Joi.string().uri().optional(),
  meeting_platform: Joi.string().valid("zoom", "gmeet", "teams").optional(),
  notes: Joi.string().optional().allow(""),
});

const updateInterviewSchema = Joi.object({
  scheduled_at: Joi.string().isoDate().optional(),
  duration_minutes: Joi.number().integer().min(15).max(480).optional(),
  timezone: Joi.string().optional(),
  interview_type: Joi.string().valid("video", "phone", "in-person").optional(),
  location: Joi.string().optional(),
  meeting_link: Joi.string().uri().optional(),
  meeting_platform: Joi.string().valid("zoom", "gmeet", "teams").optional(),
  notes: Joi.string().optional().allow(""),
  status: Joi.string().valid("scheduled", "completed", "cancelled", "no-show").optional(),
});

export { scheduleInterviewSchema, updateInterviewSchema };
