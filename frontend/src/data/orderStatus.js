export const ORDER_STATUS = {
  PENDIENTE_PAGO: 'pendiente_de_pago',
  EN_PROCESO: 'en_proceso',
  ENVIADO: 'enviado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
  FALLIDO: 'fallido'
};

export const ORDER_STATUS_CONFIG = {
  [ORDER_STATUS.PENDIENTE_PAGO]: {
    label: 'Pendiente de Pago',
    color: '#ff9800',
    step: 0
  },
  [ORDER_STATUS.EN_PROCESO]: {
    label: 'En Proceso',
    color: '#2196f3',
    step: 1
  },
  [ORDER_STATUS.ENVIADO]: {
    label: 'Enviado',
    color: '#9c27b0',
    step: 2
  },
  [ORDER_STATUS.COMPLETADO]: {
    label: 'Completado',
    color: '#4caf50',
    step: 3
  },
  [ORDER_STATUS.CANCELADO]: {
    label: 'Cancelado',
    color: '#f44336',
    step: -1
  }
};

export const getStatusInfo = (status) => {
  return ORDER_STATUS_CONFIG[status] || {
    label: 'Desconocido',
    color: '#9e9e9e',
    step: 0
  };
};