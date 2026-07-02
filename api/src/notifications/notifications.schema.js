import Joi from "joi";

const updatePreferencesSchema = Joi.object({
  email_application: Joi.boolean().optional(),
  email_interview: Joi.boolean().optional(),
  push_application: Joi.boolean().optional(),
  push_interview: Joi.boolean().optional(),
  websocket_enabled: Joi.boolean().optional(),
});

export { updatePreferencesSchema };
