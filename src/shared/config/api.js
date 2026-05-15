function resolveFallbackApiBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    const hostname = window.location.hostname?.toLowerCase() ?? "";
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const isGitHubPagesHost = hostname.endsWith(".github.io");

    if (isGitHubPagesHost) {
      return "";
    }

    if (!isLocalHost) {
      return window.location.origin;
    }
  }

  return "http://localhost:8080";
}

const fallbackApiBaseUrl = resolveFallbackApiBaseUrl();

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return fallbackApiBaseUrl;
  }

  return value.trim().replace(/\/+$/, "") || fallbackApiBaseUrl;
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL is required for this deployment target."
    );
  }

  if (!path) {
    return API_BASE_URL;
  }

	return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveApiResourceUrl(value) {
	const normalizedValue = String(value || "").trim();
	if (!normalizedValue) {
		return "";
	}

	if (
		/^https?:\/\//i.test(normalizedValue) ||
		normalizedValue.startsWith("data:") ||
		normalizedValue.startsWith("blob:")
	) {
		return normalizedValue;
	}

	if (normalizedValue.startsWith("/")) {
		return buildApiUrl(normalizedValue);
	}

	return normalizedValue;
}
