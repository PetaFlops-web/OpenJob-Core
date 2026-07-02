import Joi from "joi";

const applicationSchema = Joi.object({
  job_id: Joi.string().required(),
  status: Joi.string().optional(),
  document_id: Joi.string().optional(),
});

const updateApplicationSchema = Joi.object({
  status: Joi.string().required(),
});

const patchApplicationStatusSchema = Joi.object({
  status: Joi.string().required(),
});

export { applicationSchema, updateApplicationSchema, patchApplicationStatusSchema };
