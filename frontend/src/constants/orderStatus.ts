export const ORDER_STATUS = {
  pending: {
    key: 'pending',
    label: 'قيد الانتظار',
    color: '#FFA000',
    icon: 'time-outline',
  },
  confirmed: {
    key: 'confirmed',
    label: 'مؤكدة',
    color: '#1976D2',
    icon: 'checkmark-circle-outline',
  },
  preparing: {
    key: 'preparing',
    label: 'قيد التجهيز',
    color: '#7B1FA2',
    icon: 'construct-outline',
  },
  collecting: {
    key: 'collecting',
    label: 'قيد التجميع',
    color: '#0097A7',
    icon: 'cube-outline',
  },
  ready: {
    key: 'ready',
    label: 'جاهزة للتوصيل',
    color: '#388E3C',
    icon: 'checkmark-done-outline',
  },
  delivering: {
    key: 'delivering',
    label: 'قيد التوصيل',
    color: '#F57C00',
    icon: 'car-outline',
  },
  delivered: {
    key: 'delivered',
    label: 'تم التوصيل',
    color: '#2E7D32',
    icon: 'checkmark-done-circle-outline',
  },
  cancelled: {
    key: 'cancelled',
    label: 'ملغية',
    color: '#D32F2F',
    icon: 'close-circle-outline',
  },
};

export const getStatusInfo = (status: string) => {
  return ORDER_STATUS[status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;
};
