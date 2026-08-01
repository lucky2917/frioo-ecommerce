export const STORE_TIME_ZONE = 'Asia/Kolkata';

export const getStoreHour = (date = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: STORE_TIME_ZONE,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(date);

    const read = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return { hour: read('hour'), minute: read('minute') };
  } catch {
    return { hour: date.getHours(), minute: date.getMinutes() };
  }
};

export const formatHour = (hour) => {
  const period = hour >= 12 ? 'pm' : 'am';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${period}`;
};

export const isWithinOpeningHours = (settings, date = new Date()) => {
  if (!settings) return true;
  const { hour } = getStoreHour(date);
  return hour >= settings.opensAtHour && hour < settings.closesAtHour;
};

export const getClosedNotice = (settings, date = new Date()) => {
  if (!settings) return null;

  if (!settings.isOpen) {
    return {
      reason: 'closed',
      title: 'The store is not taking orders right now',
      detail: settings.closedMessage || 'We are back as soon as the counter reopens.'
    };
  }

  if (isWithinOpeningHours(settings, date)) return null;

  const { hour } = getStoreHour(date);
  const opensToday = hour < settings.opensAtHour;
  const opensLabel = formatHour(settings.opensAtHour);

  return {
    reason: 'outside-hours',
    title: opensToday ? `We open at ${opensLabel}` : `Store opens tomorrow ${opensLabel}`,
    detail: `Orders are taken between ${opensLabel} and ${formatHour(settings.closesAtHour)}.`
  };
};
