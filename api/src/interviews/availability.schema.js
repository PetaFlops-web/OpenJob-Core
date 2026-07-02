import Joi from "joi";

const setAvailabilitySchema = Joi.object({
  company_id: Joi.string().required(),
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  is_active: Joi.boolean().optional().default(true),
});

export { setAvailabilitySchema };
