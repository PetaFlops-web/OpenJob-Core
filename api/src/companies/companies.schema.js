import Joi from "joi";

const addCompanySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().optional().allow("", null),
  website: Joi.string().uri().allow("", null).optional(),
  industry: Joi.string().optional().allow("", null),
  company_size: Joi.string().optional().allow("", null),
  logo_url: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null),
  phone: Joi.string().optional().allow("", null),
  email: Joi.string().email().allow("", null).optional(),
  founded_year: Joi.number().integer().allow(null).optional(),
});

export { addCompanySchema };
