import Joi from "joi";

// nivel de estampado individual
const stampingLevelSchema = Joi.object({
  level: Joi.string().trim().required().messages({
    "string.empty": "El 'level' (nombre del nivel) no puede estar vacío.",
    "any.required": "El 'level' (nombre del nivel) es requerido.",
  }),
  price: Joi.number().integer().positive().required().messages({
    "number.base": "El 'price' debe ser un número.",
    "number.positive": "El 'price' debe ser un número positivo.",
    "any.required": "El 'price' es requerido.",
  }),
  description: Joi.string().trim().allow("", null).optional(),
});
//niveles de estampado
const stampingLevelsSchema = Joi.array()
  .items(stampingLevelSchema)
  .min(0) 
  .optional()
  .messages({
    "array.base": "stampingLevels debe ser un array.",
  });
// ItemType
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
  productImageUrls: Joi.array()
    .items(
       Joi.string().pattern(/^\/uploads\/[a-zA-Z0-9_.\-\s]+\.[a-zA-Z0-9]{2,5}$/)
    )
    .allow(null)
    .optional()
    .messages({
      "string.pattern.base":
        "La URL de la imagen debe seguir el formato /uploads/<filename>.<extension> (se permiten espacios)",
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

  stampingLevels: Joi.alternatives()
      .try(
        Joi.string().custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            const { error } = stampingLevelsSchema.validate(parsed); 
            if (error) return helpers.message(error.details[0].message);
            return parsed; 
          } catch (e) {
            return helpers.message("Formato JSON inválido para stampingLevels");
          }
        }),
        stampingLevelsSchema,
        Joi.allow(null)
      )
      .optional(),

}).options({ stripUnknown: true });

const createItemTypeSchema = itemTypeSchema.fork(
  ["name", "category", "hasSizes", "printingMethods"],
  (schema) => schema.required(),
);

const updateItemTypeSchema = itemTypeSchema;

export { createItemTypeSchema, updateItemTypeSchema };
