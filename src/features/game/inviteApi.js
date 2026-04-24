import { ApiError, apiFetch } from "../../shared/api/client.js";

const pendingJoinRequests = new Map();
const recentJoinResults = new Map();
const JOIN_RESULT_TTL_MS = 5000;
const useHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";

function normalizeBasePath(value) {
  const basePath = String(value || "").trim();

  if (!basePath || basePath === "/") {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/")
    ? basePath
    : `/${basePath}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function resolveFrontendOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

function buildInviteHref(inviteToken) {
  const normalizedToken = String(inviteToken || "").trim();
  if (!normalizedToken) {
    return "";
  }

  const invitePath = `/invite/${encodeURIComponent(normalizedToken)}`;
  const basePath = normalizeBasePath(import.meta.env.BASE_URL || "/");
  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");

  if (useHashRouter) {
    return `${normalizedBasePath}/#${invitePath}`;
  }

  return `${normalizedBasePath}${invitePath}`;
}

function buildInviteUrl(inviteToken, fallbackUrl = "") {
  const normalizedToken = String(inviteToken || "").trim();
  if (!normalizedToken) {
    return fallbackUrl || "";
  }

  const currentOrigin = resolveFrontendOrigin();
  const inviteHref = buildInviteHref(normalizedToken);

  if (currentOrigin && inviteHref) {
    return `${currentOrigin}${inviteHref}`;
  }

  if (!fallbackUrl) {
    return inviteHref;
  }

  try {
    const parsedUrl = new URL(fallbackUrl);
    parsedUrl.search = "";

    if (useHashRouter) {
      const basePath = normalizeBasePath(import.meta.env.BASE_URL || "/");
      parsedUrl.pathname = basePath;
      parsedUrl.hash = `#/invite/${encodeURIComponent(normalizedToken)}`;
    } else {
      parsedUrl.pathname = buildInviteHref(normalizedToken) || parsedUrl.pathname;
      parsedUrl.hash = "";
    }

    return parsedUrl.toString();
  } catch {
    return fallbackUrl;
  }
}

function buildInviteError(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return new Error(fallbackMessage);
  }

  const rawMessage = String(error.message || "").toLowerCase();

  if (rawMessage.includes("invite token is invalid")) {
    return new ApiError("Ссылка-приглашение недействительна.", {
      status: error.status,
      payload: error.payload,
    });
  }

  if (rawMessage.includes("invite token expired")) {
    return new ApiError("Срок действия ссылки-приглашения истёк.", {
      status: error.status,
      payload: error.payload,
    });
  }

  if (rawMessage.includes("invite token already used")) {
    return new ApiError("Эта ссылка-приглашение уже использована.", {
      status: error.status,
      payload: error.payload,
    });
  }

  if (rawMessage.includes("host cannot join own invite")) {
    return new ApiError("Нельзя войти по собственной ссылке как второй игрок.", {
      status: error.status,
      payload: error.payload,
    });
  }

  if (
    rawMessage.includes("missing bearer token") ||
    rawMessage.includes("invalid token")
  ) {
    return new ApiError(
      "Сессия истекла. Откройте ссылку-приглашение заново.",
      {
        status: error.status,
        payload: error.payload,
      }
    );
  }

  return new ApiError(fallbackMessage, {
    status: error.status,
    payload: error.payload,
  });
}

function getJoinCacheKey(inviteToken, token) {
  return `${String(inviteToken || "").trim()}::${String(token || "").trim() || "guest"}`;
}

function getRecentJoinResult(cacheKey) {
  const cachedEntry = recentJoinResults.get(cacheKey);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    recentJoinResults.delete(cacheKey);
    return null;
  }

  return cachedEntry.value;
}

export async function createFriendInvite(token) {
  try {
    const response = await apiFetch("/api/v1/games/invite", {
      method: "POST",
      token,
    });

    const inviteToken = response.invite_token || "";
    const inviteUrl = buildInviteUrl(
      inviteToken,
      response.invite_url || response.join_url || ""
    );

    return {
      gameId: response.game_id || "",
      inviteToken,
      inviteUrl,
      joinUrl: inviteUrl,
      expiresAt: response.expires_at || "",
      status: response.status || "waiting",
    };
  } catch (error) {
    throw buildInviteError(error, "Не удалось создать ссылку-приглашение.");
  }
}

export async function joinFriendInvite(inviteToken, token = "") {
  const cacheKey = getJoinCacheKey(inviteToken, token);
  const cachedResult = getRecentJoinResult(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const pendingRequest = pendingJoinRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const requestPromise = (async () => {
    try {
      const response = await apiFetch(
        `/api/v1/invites/${encodeURIComponent(inviteToken)}/join`,
        {
          method: "POST",
          token: token || undefined,
        }
      );

      const normalizedResponse = {
        gameId: response.game_id || "",
        inviteToken: response.invite_token || inviteToken,
        playUrl: response.play_url || "",
        sessionToken: response.session_token || token || "",
        player: {
          id: response.player?.id || "",
          username: response.player?.username || "Гость",
          isGuest: Boolean(response.player?.is_guest),
        },
        status: response.status || "waiting",
      };

      recentJoinResults.set(cacheKey, {
        value: normalizedResponse,
        expiresAt: Date.now() + JOIN_RESULT_TTL_MS,
      });

      return normalizedResponse;
    } catch (error) {
      throw buildInviteError(error, "Не удалось подключиться по приглашению.");
    } finally {
      pendingJoinRequests.delete(cacheKey);
    }
  })();

  pendingJoinRequests.set(cacheKey, requestPromise);
  return requestPromise;
}
