export function generateInventoryReason(action, field) {
  const metadata = {
    create: {
      operation: "create",
      reason: "Ingreso inicial de stock",
    },
    adjust: {
      in: {
        operation: "adjust_in",
        reason: "Ajuste manual de entrada",
      },
      out: {
        operation: "adjust_out",
        reason: "Ajuste manual de salida",
      },
      default: {
        operation: "adjust",
        reason: "Ajuste de inventario",
      },
    },
    update: {
      quantity: {
        operation: "update",
        reason: "Ajuste de cantidad de stock",
      },
      price: {
        operation: "update",
        reason: "Actualización de precio",
      },
      hexColor: {
        operation: "update",
        reason: "Cambio de color",
      },
      size: {
        operation: "update",
        reason: "Modificación de talla",
      },
      images: {
        operation: "update",
        reason: "Actualización de imágenes",
      },
      minStock: {
        operation: "update",
        reason: "Ajuste de stock mínimo",
      },
      isActive: {
        operation: "update",
        reason: "Cambio de estado activo",
      },
      default: {
        operation: "update",
        reason: "Actualización de información del ítem",
      },
    },
    deactivate: {
      operation: "deactivate",
      reason: "Desactivación lógica del ítem",
    },
    reactivate: {
      operation: "reactivate",
      reason: "Reactivación del ítem previamente desactivado",
    },
    delete: {
      operation: "delete",
      reason: "Eliminación permanente del ítem",
    },
    sale: {
      operation: "sale",
      reason: "Salida por venta",
    },
    return: {
      operation: "return",
      reason: "Ingreso por devolución",
    },
    purge: {
      operation: "purge",
      reason: "Eliminación masiva de ítems inactivos",
    },
  };

  if (action === "update") {
    const fieldMeta = metadata.update[field] || metadata.update.default;
    if (!fieldMeta?.operation) {
      console.warn(
        `No se encontró metadata válida para el campo '${field}' en acción 'update'`,
      );
    }
    return fieldMeta;
  }

  if (action === "adjust") {
    const direction = field || "default";
    const result = metadata.adjust[direction] || metadata.adjust.default;
    return result;
  }

  const result = metadata[action] || {
    operation: "unspecified",
    reason: "Movimiento generado automáticamente",
  };

  if (result.operation === "unspecified") {
    console.warn(`No se encontró un metadata válido para la acción: ${action}`);
  }

  return result;
}

export function createItemSnapshot(entity) {
  if ("itemType" in entity) {
    return {
      snapshotItemName: entity?.itemType?.name || "Desconocido",
      snapshotItemColor: entity?.hexColor || null,
      snapshotItemSize: entity?.size || null,
      snapshotPrice: entity?.price || null,
    };
  } else if ("name" in entity && "price" in entity && !("itemType" in entity)) {
    return {
      snapshotItemName: entity.name,
      snapshotItemColor: null,
      snapshotItemSize: null,
      snapshotPrice: entity.price ?? null,
    };
  } else {
    return {
      snapshotItemName: "Entidad desconocida",
      snapshotItemColor: null,
      snapshotItemSize: null,
      snapshotPrice: null,
    };
  }
}
