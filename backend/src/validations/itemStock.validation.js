import Joi from "joi";

const itemStockSchema = Joi.object({
  itemTypeId: Joi.number().integer().positive().required().messages({
    "any.required": "El tipo de ítem es obligatorio.",
    "number.base": "El ID del tipo de ítem debe ser un número."
  }),

  colorId: Joi.number().integer().positive().required().messages({
    "any.required": "El color es obligatorio.",
    "number.base": "El ID del color debe ser un número."
  }),

  size: Joi.when("requiresSize", {
    is: true,
    then: Joi.string().required().messages({
      "any.required": "El campo size es obligatorio para este tipo de artículo",
    }),
    otherwise: Joi.string().optional().allow(null),
  }),

  quantity: Joi.number().integer().min(0).required(),

  minStock: Joi.number().integer().min(0).optional(),

  requiresSize: Joi.boolean().optional(),
}).unknown(true); 

const itemStockUpdateSchema = Joi.object({
  hexColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),

  size: Joi.string().optional().allow(null),

  quantity: Joi.number().integer().min(0).optional(),

  minStock: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().optional(),
}).unknown(false);

export { itemStockSchema, itemStockUpdateSchema };
