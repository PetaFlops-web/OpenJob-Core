import Joi from "joi";

const verifyMFASchema = Joi.object({
  token: Joi.string().required(),
  mfa_token: Joi.string().optional(),
});

export { verifyMFASchema };
