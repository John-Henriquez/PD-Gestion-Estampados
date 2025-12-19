import { INVENTORY_OPERATIONS } from "../constants/inventoryOperations.js";

export function generateInventoryReason(slug) {
  const operation = INVENTORY_OPERATIONS.find(op => op.slug === slug);

  if (!operation) {
    console.warn(`[Inventory] Operación no reconocida: ${slug}. Usando fallback.`);
    return {
      operation: "unspecified",
      reason: "Movimiento generado automáticamente",
      type: "ajuste"
    };
  }
  return {
    operation: operation.slug,
    reason: operation.name,
    type: operation.type
  };
}

export function createItemSnapshot(entity) {
  if ("itemType" in entity) {
    return {
      snapshotItemName: entity?.itemType?.name || "Desconocido",
      snapshotItemColor: entity?.color?.name || entity?.hexColor || "Sin color",
      snapshotItemSize: entity?.size || "N/A",
      snapshotPrice: entity?.price || 0,
    };
  } else if ("name" in entity && "price" in entity && !("itemType" in entity)) {
    return {
      snapshotItemName: entity.name,
      snapshotItemColor: null,
      snapshotItemSize: null,
      snapshotPrice: entity.price ?? 0,
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
