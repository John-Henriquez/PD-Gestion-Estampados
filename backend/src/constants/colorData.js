export const COLOR_FAMILIES = {
  BASICOS: 'BASICOS',
  CALIDOS: 'CALIDOS',
  FRIOS: 'FRIOS',
  TIERRA: 'TIERRA',
  PASTELES: 'PASTELES',
  METALICOS: 'METALICOS',
  NATURALEZA: 'NATURALEZA',
};

export const COLOR_DICTIONARY = [
  // --- BASICOS ---
  { name: 'Negro', hex: '#000000', family: COLOR_FAMILIES.BASICOS },
  { name: 'Blanco', hex: '#FFFFFF', family: COLOR_FAMILIES.BASICOS },
  { name: 'Gris', hex: '#808080', family: COLOR_FAMILIES.BASICOS },
  { name: 'Gris claro', hex: '#D3D3D3', family: COLOR_FAMILIES.BASICOS },
  { name: 'Gris oscuro', hex: '#A9A9A9', family: COLOR_FAMILIES.BASICOS },
  { name: 'Carbón', hex: '#36454F', family: COLOR_FAMILIES.BASICOS },
  { name: 'Pizarra', hex: '#708090', family: COLOR_FAMILIES.BASICOS },
  { name: 'Humo', hex: '#F5F5F5', family: COLOR_FAMILIES.BASICOS },

  // --- CALIDOS ---
  { name: 'Rojo', hex: '#FF0000', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Amarillo', hex: '#FFFF00', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Naranja', hex: '#FFA500', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Rosa', hex: '#FFC0CB', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Rosado fuerte', hex: '#FF69B4', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Fucsia', hex: '#FF00FF', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Magenta', hex: '#FF00FE', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Coral', hex: '#FF7F50', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Granate', hex: '#800000', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Borgoña', hex: '#800020', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Anaranjado quemado', hex: '#CC5500', family: COLOR_FAMILIES.CALIDOS },
  { name: 'Ámbar', hex: '#FFBF00', family: COLOR_FAMILIES.CALIDOS },

  // --- FRIOS ---
  { name: 'Azul', hex: '#0000FF', family: COLOR_FAMILIES.FRIOS },
  { name: 'Azul marino', hex: '#000080', family: COLOR_FAMILIES.FRIOS },
  { name: 'Azul real', hex: '#4169E1', family: COLOR_FAMILIES.FRIOS },
  { name: 'Azul acero', hex: '#4682B4', family: COLOR_FAMILIES.FRIOS },
  { name: 'Cian', hex: '#00FFFF', family: COLOR_FAMILIES.FRIOS },
  { name: 'Turquesa', hex: '#40E0D0', family: COLOR_FAMILIES.FRIOS },
  { name: 'Púrpura', hex: '#800080', family: COLOR_FAMILIES.FRIOS },
  { name: 'Morado', hex: '#6A0DAD', family: COLOR_FAMILIES.FRIOS },
  { name: 'Indigo', hex: '#4B0082', family: COLOR_FAMILIES.FRIOS },

  // --- NATURALEZA (Verdes) ---
  { name: 'Verde', hex: '#008000', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Verde lima', hex: '#00FF00', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Verde bosque', hex: '#228B22', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Verde oliva', hex: '#808000', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Verde esmeralda', hex: '#50C878', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Esmeralda', hex: '#2ECC71', family: COLOR_FAMILIES.NATURALEZA },
  { name: 'Aguamarina', hex: '#7FFFD4', family: COLOR_FAMILIES.NATURALEZA },

  // --- TIERRA ---
  { name: 'Marrón', hex: '#A52A2A', family: COLOR_FAMILIES.TIERRA },
  { name: 'Chocolate', hex: '#D2691E', family: COLOR_FAMILIES.TIERRA },
  { name: 'Terracota', hex: '#E2725B', family: COLOR_FAMILIES.TIERRA },
  { name: 'Tierra', hex: '#70543E', family: COLOR_FAMILIES.TIERRA },
  { name: 'Mostaza', hex: '#FFDB58', family: COLOR_FAMILIES.TIERRA },
  { name: 'Salmón', hex: '#FA8072', family: COLOR_FAMILIES.TIERRA },

  // --- PASTELES / CLAROS ---
  { name: 'Celeste', hex: '#87CEEB', family: COLOR_FAMILIES.PASTELES },
  { name: 'Azul cielo', hex: '#87CEFA', family: COLOR_FAMILIES.PASTELES },
  { name: 'Lavanda', hex: '#E6E6FA', family: COLOR_FAMILIES.PASTELES },
  { name: 'Violeta', hex: '#EE82EE', family: COLOR_FAMILIES.PASTELES },
  { name: 'Lila', hex: '#C8A2C8', family: COLOR_FAMILIES.PASTELES },
  { name: 'Malva', hex: '#B57EDC', family: COLOR_FAMILIES.PASTELES },
  { name: 'Verde menta', hex: '#98FF98', family: COLOR_FAMILIES.PASTELES },
  { name: 'Verde claro', hex: '#90EE90', family: COLOR_FAMILIES.PASTELES },
  { name: 'Rosa pálido', hex: '#FADADD', family: COLOR_FAMILIES.PASTELES },
  { name: 'Beige', hex: '#F5F5DC', family: COLOR_FAMILIES.PASTELES },
  { name: 'Crema', hex: '#FFFDD0', family: COLOR_FAMILIES.PASTELES },
  { name: 'Marfil', hex: '#FFFFF0', family: COLOR_FAMILIES.PASTELES },

  // --- METALICOS ---
  { name: 'Oro', hex: '#FFD700', family: COLOR_FAMILIES.METALICOS },
  { name: 'Plateado', hex: '#C0C0C0', family: COLOR_FAMILIES.METALICOS },
  { name: 'Bronce', hex: '#CD7F32', family: COLOR_FAMILIES.METALICOS },
  { name: 'Cobre', hex: '#B87333', family: COLOR_FAMILIES.METALICOS },
  { name: 'Champán', hex: '#F7E7CE', family: COLOR_FAMILIES.METALICOS },
  { name: 'Perla', hex: '#EAE0C8', family: COLOR_FAMILIES.METALICOS },
  { name: 'Gris perla', hex: '#C1C1C1', family: COLOR_FAMILIES.METALICOS },
];

export const getColorGroups = () => {
  return COLOR_DICTIONARY.reduce((acc, color) => {
    if (!acc[color.family]) acc[color.family] = [];
    acc[color.family].push(color.name);
    return acc;
  }, {});
};