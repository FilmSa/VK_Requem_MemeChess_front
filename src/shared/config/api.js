const fallbackApiBaseUrl = "http://localhost:8080";

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return fallbackApiBaseUrl;
  }

  return value.trim().replace(/\/+$/, "") || fallbackApiBaseUrl;
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
