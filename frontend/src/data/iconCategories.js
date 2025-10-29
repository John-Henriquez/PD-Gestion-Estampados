import {
  Shirt,
  Coffee,
  GlassWater,
  Key,
  Table,
  Notebook,
  Gift,
  GraduationCap,
  Baby,
  Backpack,
  Smartphone,
  FlaskConical,
} from 'lucide-react';

const ICON_CATEGORIES = [
  {
    name: 'Ropa y Textiles',
    icons: [
      { label: 'Camiseta', value: 'shirt', Icon: Shirt },
      { label: 'Gorra', value: 'cap', Icon: GraduationCap },
      { label: 'Pijama', value: 'pijama', Icon: Baby },
      { label: 'Bolso/Mochila', value: 'bag', Icon: Backpack },
    ],
  },
  {
    name: 'Accesorios',
    icons: [
      { label: 'Taza', value: 'mug', Icon: Coffee },
      { label: 'Vaso', value: 'glass', Icon: GlassWater },
      { label: 'Llave', value: 'key', Icon: Key },
    ],
  },
  {
    name: 'Hogar',
    icons: [
      { label: 'Mesa', value: 'table', Icon: Table },
      { label: 'Smartphone', value: 'phone', Icon: Smartphone },
    ],
  },
  {
    name: 'Promocionales/Regalos',
    icons: [
      { label: 'Libreta', value: 'notebook', Icon: Notebook },
      { label: 'Botella', value: 'bottle', Icon: FlaskConical },
      { label: 'Regalo', value: 'gift', Icon: Gift },
    ],
  },
];

export const iconMap = ICON_CATEGORIES.flatMap((c) => c.icons).reduce((map, { value, Icon }) => {
  map[value] = Icon;
  return map;
}, {});
