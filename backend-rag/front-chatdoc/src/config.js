export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function resolveApiUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
