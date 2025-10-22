import Joi from "joi";

const itemTypeSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim().messages({
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener al menos 3 caracteres",
    "string.max": "El nombre no puede exceder los 100 caracteres",
  }),
  description: Joi.string().allow("", null).optional().messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  category: Joi.string().valid("clothing", "object").messages({
    "any.only": "La categoría debe ser 'clothing' o 'object'",
  }),
  hasSizes: Joi.boolean().messages({
    "boolean.base": "hasSizes debe ser un valor booleano",
  }),
  printingMethods: Joi.array()
    .items(
      Joi.string().valid("sublimación", "DTF", "vinilo").trim().messages({
        "any.only":
          "Los métodos de impresión deben ser 'sublimación', 'DTF' o 'vinilo'",
        "string.empty":
          "Los métodos de impresión no pueden contener elementos vacíos",
      }),
    )
    .min(1)
    .messages({
      "array.min": "Debe especificar al menos un método de impresión",
    }),
  baseImageUrl: Joi.string()
    .pattern(/^\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z]{2,4}$/)
    .allow(null)
    .optional()
    .messages({
      "string.pattern.base":
        "La URL de la imagen debe seguir el formato /uploads/<filename>.<extension>",
    }),
  sizesAvailable: Joi.array()
    .items(
      Joi.string().valid("S", "M", "L", "XL", "XXL").messages({
        "any.only": "Las tallas deben ser 'S', 'M', 'L', 'XL' o 'XXL'",
      }),
    )
    .when("hasSizes", {
      is: true,
      then: Joi.array().min(1).required().messages({
        "array.min":
          "Debe especificar al menos una talla cuando hasSizes es true",
        "any.required": "Las tallas son requeridas cuando hasSizes es true",
      }),
      otherwise: Joi.forbidden().messages({
        "any.unknown":
          "No se permite el campo sizesAvailable cuando hasSizes es false",
      }),
    }),
}).options({ stripUnknown: true });

// Esquema para creación (POST)
const createItemTypeSchema = itemTypeSchema.fork(
  ["name", "category", "hasSizes", "printingMethods"],
  (schema) => schema.required(),
);

// Esquema para actualización (PATCH)
const updateItemTypeSchema = itemTypeSchema;

export { createItemTypeSchema, updateItemTypeSchema };
