export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '8884871345-9850sa7ili8gtju9c8vcf8ui96k1vlv2.apps.googleusercontent.com';

export function resolveApiUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
