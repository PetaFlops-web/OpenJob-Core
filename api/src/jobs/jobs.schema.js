import Joi from "joi";

const jobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  job_type: Joi.string().required(),
  experience_level: Joi.string().required(),
  company_id: Joi.string().required(),
  category_id: Joi.string().required(),
  location_type: Joi.string().optional().allow(""),
  location_city: Joi.string().optional().allow(""),
  salary_min: Joi.number().integer().allow(null).optional(),
  salary_max: Joi.number().integer().allow(null).optional(),
  is_salary_visible: Joi.boolean().optional(),
  status: Joi.string().required(),
  requirements: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
});

export const updateJobSchema = Joi.object({
  company_id: Joi.string().optional(),
  category_id: Joi.string().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  job_type: Joi.string().optional(),
  experience_level: Joi.string().optional(),
  location_type: Joi.string().optional(),
  location_city: Joi.string().optional(),
  salary_min: Joi.number().integer().allow(null).optional(),
  salary_max: Joi.number().integer().allow(null).optional(),
  is_salary_visible: Joi.boolean().optional(),
  status: Joi.string().optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
});

export const searchJobSchema = Joi.object({
  search: Joi.string().trim().min(1).required(),
});

export { jobSchema };
