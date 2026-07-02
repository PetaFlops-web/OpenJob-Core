import Joi from "joi";

export const addUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("jobseeker", "recruiter").required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  location: Joi.string().optional(),
  bio: Joi.string().optional(),
  avatar: Joi.string().optional(),
});
