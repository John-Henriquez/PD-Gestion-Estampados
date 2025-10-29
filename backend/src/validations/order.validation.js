import Joi from "joi";

const orderItemSchema = Joi.object({
  itemStockId: Joi.number().integer().positive().optional(),
  packId: Joi.number().integer().positive().optional(),
  quantity: Joi.number().integer().positive().required().messages({
    "number.base": "La cantidad debe ser un número.",
    "number.integer": "La cantidad debe ser un entero.",
    "number.positive": "La cantidad debe ser mayor que cero.",
    "any.required": "La cantidad es requerida.",
  }),
  stampImageUrl: Joi.string().allow(null, "").optional().messages({}),
  stampInstructions: Joi.string().allow(null, "").optional(),
})
  .xor("itemStockId", "packId")
  .messages({
    "object.xor":
      "Cada item debe tener `itemStockId` O `packId`, pero no ambos.",
  });

const customerDataSchema = Joi.object({
  name: Joi.string().optional().allow(null, ""),
  email: Joi.string().email().required().messages({
    "string.email": "El email del cliente no es válido.",
    "any.required":
      "El email del cliente es requerido para pedidos de invitados.",
    "string.empty": "El email del cliente no puede estar vacío.",
  }),
});

export const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    "array.base": "El campo `items` debe ser un array.",
    "array.min": "El pedido debe contener al menos un item.",
    "any.required": "El campo `items` es requerido.",
  }),

  customerData: Joi.object()
    .when(Joi.ref("$isGuest"), {
      is: true,
      then: customerDataSchema.required(),
      otherwise: customerDataSchema.optional().allow(null, {}),
    })
    .messages({
      "any.required": "customerData es requerido para pedidos de invitados.",
    }),
});
