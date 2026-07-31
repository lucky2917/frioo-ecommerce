let listeners = [];
let entries = [];
let nextId = 0;

const DURATIONS = {
  success: 4000,
  info: 4000,
  warning: null,
  error: null,
};

const emit = () => listeners.forEach((listener) => listener(entries));

export const getFeedbackEntries = () => entries;

export const subscribeToFeedback = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
};

export const dismissFeedback = (id) => {
  entries = entries.filter((entry) => entry.id !== id);
  emit();
};

const push = (tone, message, { title } = {}) => {
  if (!message) return null;
  const id = ++nextId;
  entries = [...entries.filter((entry) => entry.message !== message), { id, tone, message, title }];
  emit();
  const duration = DURATIONS[tone];
  if (duration) setTimeout(() => dismissFeedback(id), duration);
  return id;
};

export const notify = {
  success: (message, options) => push('success', message, options),
  error: (message, options) => push('error', message, options),
  warning: (message, options) => push('warning', message, options),
  info: (message, options) => push('info', message, options),
};
