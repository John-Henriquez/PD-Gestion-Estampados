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
  if (!entity) return { snapshotItemName: "Sin datos" };

  if ("itemType" in entity || entity.itemType) {
    return {
      snapshotItemName: entity.itemType?.name || "Producto desconocido",
      snapshotItemColor: entity.color?.hex || entity.hexColor || null, 
      snapshotItemSize: entity.size || "N/A",
      snapshotItemTypeName: entity.itemType?.category || "item",
      snapshotPrice: entity.price || 0,
    };
  } 
  if ("name" in entity) {
    return {
      snapshotItemName: entity.name,
      snapshotItemColor: null,
      snapshotItemSize: null,
      snapshotItemTypeName: "pack",
      snapshotPrice: entity.price ?? 0,
    };
  }

  return {
    snapshotItemName: "Entidad desconocida",
    snapshotItemColor: null,
    snapshotItemSize: null,
    snapshotPrice: null,
  };
}
