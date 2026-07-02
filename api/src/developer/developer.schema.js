import Joi from "joi";

const createApiKeySchema = Joi.object({
  company_id: Joi.string().required(),
  name: Joi.string().required(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

export { createApiKeySchema };
