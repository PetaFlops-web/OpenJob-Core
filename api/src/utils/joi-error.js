const getFieldName = (detail) => detail.context?.label || detail.context?.key || detail.path.join(".");

const getAllowedValues = (detail) => {
  const validValues = detail.context?.valids || detail.context?.validValues || [];
  return validValues.filter((value) => value !== undefined && value !== null && value !== "").join(", ");
};

const validationKeyByType = {
  "any.required": "validation:required",
  "string.empty": "validation:required",
  "string.email": "validation:email",
  "string.min": "validation:min",
  "string.max": "validation:max",
  "string.pattern.base": "validation:pattern",
  "string.uri": "validation:uri",
  "string.base": "validation:string",
  "number.base": "validation:number",
  "number.integer": "validation:integer",
  "number.min": "validation:minNumber",
  "number.max": "validation:maxNumber",
  "boolean.base": "validation:boolean",
  "array.base": "validation:array",
  "object.base": "validation:object",
  "object.unknown": "validation:unknown",
  "any.only": "validation:enum",
};

const formatJoiErrorDetail = (detail, t) => {
  const key = validationKeyByType[detail.type] || "validation:invalid";
  const field = getFieldName(detail);

  return t(key, {
    field,
    min: detail.context?.limit,
    max: detail.context?.limit,
    limit: detail.context?.limit,
    values: getAllowedValues(detail),
  });
};

const formatJoiError = (error, t) => error.details.map((detail) => formatJoiErrorDetail(detail, t));

export { formatJoiError };
