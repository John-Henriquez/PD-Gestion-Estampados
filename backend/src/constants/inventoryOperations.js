export const INVENTORY_OPERATIONS = [
  // ENTRADAS
  { slug: "initial_load", name: "Carga Inicial", type: "entrada", description: "Stock ingresado al crear el producto por primera vez" },
  { slug: "purchase", name: "Compra a Proveedor", type: "entrada", description: "Ingreso de stock por orden de compra a proveedores" },
  { slug: "return", name: "Devolución de Cliente", type: "entrada", description: "Reingreso por devolución de producto vendido" },
  { slug: "adjust_in", name: "Ajuste de Entrada", type: "entrada", description: "Corrección manual por inventario físico" },
  { slug: "pack_disassembly", name: "Desarmado de Pack", type: "entrada", description: "Retorno de unidades individuales al desarmar un paquete" },
  { slug: "restock", name: "Recarga de Stock", type: "entrada", description: "Reabastecimiento de variantes existentes" },

  // SALIDAS
  { slug: "sale", name: "Venta Directa", type: "salida", description: "Egreso automático por venta confirmada" },
  { slug: "waste", name: "Merma / Daño", type: "salida", description: "Producto inutilizable por errores de estampado o fallas de fábrica" },
  { slug: "adjust_out", name: "Ajuste de Salida", type: "salida", description: "Corrección manual por inventario físico (sobrante registrado erróneamente)" },
  { slug: "pack_assembly", name: "Armado de Pack", type: "salida", description: "Unidades reservadas o extraídas para conformar un paquete" },

  // MODIFICACIONES
  { slug: "deactivate", name: "Desactivación de Stock", type: "ajuste", description: "El stock deja de estar disponible para la venta (Papelera)" },
  { slug: "reactivate", name: "Reactivación de Stock", type: "ajuste", description: "El stock vuelve a estar disponible para la venta" },
  { slug: "type_deactivation", name: "Desactivación por Tipo", type: "ajuste", description: "Stock desactivado automáticamente porque su Categoría se desactivó" },
  { slug: "purge", name: "Eliminación Permanente", type: "ajuste", description: "Borrado físico de los registros del sistema" },

  { slug: "update_info", name: "Cambio de Información", type: "ajuste", description: "Modificación de nombres, descripciones o imágenes" },
  { slug: "price_change", name: "Cambio de Precio", type: "ajuste", description: "Actualización de valores en los niveles de estampado" },
  { slug: "min_stock_change", name: "Ajuste de Stock Mínimo", type: "ajuste", description: "Cambio en el umbral de alerta de reposición" }
];