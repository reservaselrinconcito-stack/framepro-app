export const isTauriApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
};

export const getAppPath = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!isTauriApp()) return normalized;
  return `#${normalized}`;
};

export const getRoutePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};
