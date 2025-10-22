import Joi from "joi";

const itemStockSchema = Joi.object({
  itemTypeId: Joi.number().integer().required(),

  hexColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .required(),

  size: Joi.when("requiresSize", {
    is: true,
    then: Joi.string().required().messages({
      "any.required": "El campo size es obligatorio para este tipo de artículo",
    }),
    otherwise: Joi.string().optional().allow(null),
  }),

  quantity: Joi.number().integer().min(0).required(),

  price: Joi.number().integer().min(0).required(),

  images: Joi.array().items(Joi.string().uri()).optional().default([]),

  minStock: Joi.number().integer().min(0).optional(),

  // Campo auxiliar para validar tamaño, no se enviaría al backend
  requiresSize: Joi.boolean().optional(),
}).unknown(true); // para permitir que se envíen otros campos como requiresSize

const itemStockUpdateSchema = Joi.object({
  hexColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),

  size: Joi.string().optional().allow(null),

  quantity: Joi.number().integer().min(0).optional(),

  price: Joi.number().integer().min(0).optional(),

  images: Joi.array().items(Joi.string().uri()).optional(),

  minStock: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().optional(),
}).unknown(false);

export { itemStockSchema, itemStockUpdateSchema };
