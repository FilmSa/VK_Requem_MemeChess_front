const AUTH_TOKEN_COOKIE_NAME = "meme_chess_auth_token";
const LEGACY_AUTH_TOKEN_STORAGE_KEY = "meme-chess.auth.token";
const AUTH_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookieValue(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookiePrefix = `${name}=`;
  const cookieEntry = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix));

  if (!cookieEntry) {
    return "";
  }

  const rawValue = cookieEntry.slice(cookiePrefix.length);

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function buildCookieAttributes(maxAgeSeconds) {
  const attributes = ["Path=/", "SameSite=Lax"];

  if (typeof maxAgeSeconds === "number") {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (typeof window !== "undefined" && window.location?.protocol === "https:") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function writeCookieValue(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") {
    return;
  }

  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; ${buildCookieAttributes(maxAgeSeconds)}`;
}

function removeLegacyStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore legacy storage access issues.
  }
}

export function readStoredAuthToken() {
  const cookieToken = readCookieValue(AUTH_TOKEN_COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }

  if (typeof window === "undefined") {
    return "";
  }

  try {
    const legacyToken =
      window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY) || "";

    if (legacyToken) {
      writeCookieValue(
        AUTH_TOKEN_COOKIE_NAME,
        legacyToken,
        AUTH_TOKEN_COOKIE_MAX_AGE_SECONDS
      );
      removeLegacyStoredToken();
    }

    return legacyToken;
  } catch {
    return "";
  }
}

export function persistAuthToken(token, options = {}) {
  const { remember = true } = options;

  if (token) {
    writeCookieValue(
      AUTH_TOKEN_COOKIE_NAME,
      token,
      remember ? AUTH_TOKEN_COOKIE_MAX_AGE_SECONDS : undefined
    );
    removeLegacyStoredToken();
    return;
  }

  writeCookieValue(AUTH_TOKEN_COOKIE_NAME, "", 0);
  removeLegacyStoredToken();
}
