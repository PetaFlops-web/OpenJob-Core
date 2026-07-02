import Joi from "joi";

export const addSkillSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Skill name is required",
    "string.empty": "Skill name cannot be empty",
    "string.max": "Skill name cannot exceed 100 characters",
  }),
});

export const addSkillsBulkSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().min(1).max(100)).min(1).max(50).required().messages({
    "any.required": "Skills array is required",
    "array.min": "At least one skill is required",
    "array.max": "Cannot add more than 50 skills at once",
  }),
});
