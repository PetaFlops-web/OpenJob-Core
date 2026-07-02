import Joi from "joi";

export const scanCvSchema = Joi.object({
  documentId: Joi.string().required().messages({
    "any.required": "Document ID diperlukan.",
    "string.empty": "Document ID tidak boleh kosong.",
  }),
  skills: Joi.string().allow("").optional(),
  jobSummary: Joi.string().allow("").optional(),
});
