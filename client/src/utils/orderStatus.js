export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
];

const STATUS_PRESENTATION = {
  pending: { label: 'Order received', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'brand' },
  ready: { label: 'Ready', tone: 'brand' },
  'out-for-delivery': { label: 'Out for delivery', tone: 'brand' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

const humanizeStatus = (status) => {
  const text = (status || '').replace(/-/g, ' ').trim();
  if (!text) return 'Processing';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getStatusPresentation = (status) =>
  STATUS_PRESENTATION[status] || { label: humanizeStatus(status), tone: 'info' };

export const getStatusStepIndex = (status) => ORDER_STATUS_FLOW.indexOf(status);

export const getStatusProgress = (status) => {
  const index = getStatusStepIndex(status);
  if (index < 0) return 0;
  return Math.max(0, (index / (ORDER_STATUS_FLOW.length - 1)) * 100);
};

export const isActiveStatus = (status) => status !== 'delivered' && status !== 'cancelled';

export const formatOrderAmount = (value) => Number(value || 0).toFixed(0);
