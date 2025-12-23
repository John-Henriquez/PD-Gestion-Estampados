import Joi from "joi";
// item individual 
const singleItemSchema = Joi.object({
  itemTypeId: Joi.number().integer().positive().required().messages({
    "any.required": "El tipo de ítem es obligatorio.",
    "number.base": "El ID del tipo de ítem debe ser un número."
  }),
  colorId: Joi.number().integer().positive().required().messages({
    "any.required": "El color es obligatorio.",
    "number.base": "El ID del color debe ser un número."
  }),
  size: Joi.string().optional().allow(null, ""),
  quantity: Joi.number().integer().min(0).required(),
  minStock: Joi.number().integer().min(0).optional(),
}).unknown(true);

const itemStockSchema = Joi.alternatives().try(
  singleItemSchema,
  Joi.array().items(singleItemSchema).min(1)
);

const itemStockUpdateSchema = Joi.object({
  size: Joi.string().optional().allow(null),
  quantity: Joi.number().integer().min(0).optional(),
  minStock: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);

export { itemStockSchema, itemStockUpdateSchema };
