const ADMIN_HOSTS = ['admin.frioo.in'];

export const isAdminHost = () =>
  typeof window !== 'undefined' && ADMIN_HOSTS.includes(window.location.hostname);
