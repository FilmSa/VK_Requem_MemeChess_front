import { ApiError, apiFetch } from "../../shared/api/client.js";

function normalizeParticipant(participant) {
  if (!participant) {
    return null;
  }

  return {
    id: participant.id || "",
    username: participant.username || "",
    avatar_url: participant.avatar_url || "",
    is_guest: Boolean(participant.is_guest),
  };
}

function buildGameError(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return new Error(fallbackMessage);
  }

  return new ApiError(error.message || fallbackMessage, {
    status: error.status,
    fields: error.fields,
    payload: error.payload,
  });
}

function normalizeMatchSearchResult(response) {
  return {
    status: response?.status || "",
    gameId: response?.game_id || "",
    agreedStake: Number(response?.agreed_stake ?? 0),
    gameCurrency: response?.game_currency || "",
    gameMode: response?.game_mode || "",
  };
}

function buildMatchSearchError(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return new Error(fallbackMessage);
  }

  const rawMessage = String(error.message || "").toLowerCase();

  if (
    error.status === 409 ||
    rawMessage.includes("insufficient game currency")
  ) {
    return new ApiError("Недостаточно игровой валюты для этой ставки.", {
      status: error.status,
      fields: error.fields,
      payload: error.payload,
    });
  }

  if (error.status === 400) {
    return new ApiError("Проверьте режим и диапазон ставки.", {
      status: error.status,
      fields: error.fields,
      payload: error.payload,
    });
  }

  if (error.status === 401) {
    return new ApiError("Сессия истекла. Войдите снова.", {
      status: error.status,
      fields: error.fields,
      payload: error.payload,
    });
  }

  return buildGameError(error, fallbackMessage);
}

export async function getGameParticipants(gameId, token) {
  try {
    const response = await apiFetch(
      `/api/v1/games/${encodeURIComponent(gameId)}/participants`,
      {
        method: "GET",
        token,
      }
    );

    return {
      gameId: response.game_id || gameId,
      player1: normalizeParticipant(response.player1),
      player2: normalizeParticipant(response.player2),
    };
  } catch (error) {
    throw buildGameError(error, "Не удалось загрузить участников партии.");
  }
}

export async function searchMatch(params, token) {
  try {
    const response = await apiFetch("/api/v1/games/match-search", {
      method: "POST",
      token,
      body: {
        game_mode: params.gameMode,
        min_stake: params.minStake,
        max_stake: params.maxStake,
      },
    });

    return normalizeMatchSearchResult(response);
  } catch (error) {
    throw buildMatchSearchError(error, "Не удалось запустить матчмейкинг.");
  }
}

export async function leaveMatchSearch(token) {
  try {
    const response = await apiFetch("/api/v1/games/match-search/leave", {
      method: "POST",
      token,
    });

    return {
      status: response?.status || "idle",
    };
  } catch (error) {
    throw buildGameError(error, "Не удалось выйти из поиска.");
  }
}
