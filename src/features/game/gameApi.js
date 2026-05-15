import { ApiError, apiFetch } from "../../shared/api/client.js";
import { resolveApiResourceUrl } from "../../shared/config/api.js";

function normalizeParticipant(participant) {
  if (!participant) {
    return null;
  }

  return {
    id: participant.id || "",
    username: participant.username || "",
    avatar_url: resolveApiResourceUrl(participant.avatar_url || ""),
    is_guest: Boolean(participant.is_guest),
  };
}

function normalizeHistoryOpponent(opponent) {
  if (!opponent) {
    return null;
  }

  return {
    id: opponent.id || "",
    username: opponent.username || "",
    avatar_url: resolveApiResourceUrl(opponent.avatar_url || ""),
  };
}

function normalizeHistoryEntry(entry) {
  if (!entry) {
    return null;
  }

  return {
    gameId: entry.game_id || "",
    status: String(entry.status || "").trim().toLowerCase(),
    gameMode: String(entry.game_mode || "").trim().toLowerCase(),
    betAmount: Number(entry.bet_amount ?? 0),
    currency: entry.currency || "",
    timeControlId: entry.time_control_id || "",
    youArePlayer1: Boolean(entry.you_are_player1),
    opponent: normalizeHistoryOpponent(entry.opponent),
    winnerId: entry.winner_id || "",
    finishedAt: entry.finished_at || "",
    finishedReason: entry.finished_reason || "",
    fen: entry.fen || "",
    lastMove: entry.last_move || "",
    lastMoveNumber: Number(entry.last_move_number ?? 0),
    createdAt: entry.created_at || "",
  };
}

export async function declareTimeoutLoss(gameId, token) {
  try {
    return await apiFetch(`/api/v1/games/${encodeURIComponent(gameId)}/timeout`, {
      method: "POST",
      token,
    });
  } catch (error) {
    throw buildGameError(
      error,
      "Не удалось завершить партию по времени."
    );
  }
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
    timeControlId: response?.time_control_id || "",
    timeControlLabel: response?.time_control_label || "",
    timeControlBaseMs: Number(response?.time_control_base_ms ?? 0),
    timeControlIncrementMs: Number(response?.time_control_increment_ms ?? 0),
    player1RemainingMs: Number(response?.player1_remaining_ms ?? 0),
    player2RemainingMs: Number(response?.player2_remaining_ms ?? 0),
    currentTurnStartedAt: response?.current_turn_started_at || "",
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

export async function getMyGameHistory(token, options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 20, 100));
  const offset = Math.max(0, Number(options.offset) || 0);
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  try {
    const response = await apiFetch(`/api/v1/games/history?${searchParams.toString()}`, {
      method: "GET",
      token,
    });

    return {
      games: Array.isArray(response?.games)
        ? response.games.map((entry) => normalizeHistoryEntry(entry)).filter(Boolean)
        : [],
      hasMore: Boolean(response?.has_more),
      nextOffset: Number(response?.next_offset ?? offset + (Array.isArray(response?.games) ? response.games.length : 0)),
    };
  } catch (error) {
    throw buildGameError(error, "Не удалось загрузить историю игр.");
  }
}

export async function searchMatch(params, token) {
  try {
    const response = await apiFetch("/api/v1/games/match-search", {
      method: "POST",
      token,
      body: {
        game_mode: params.gameMode,
        time_control_id: params.timeControlId,
        min_stake: params.minStake,
        max_stake: params.maxStake,
      },
    });

    return normalizeMatchSearchResult(response);
  } catch (error) {
    throw buildMatchSearchError(error, "Не удалось запустить матчмейкинг.");
  }
}

export async function createRobotGame(params, token) {
  try {
    const response = await apiFetch("/api/v1/games/robot", {
      method: "POST",
      token,
      body: {
        game_mode: params.gameMode,
        difficulty: params.difficulty,
      },
    });

    return {
      gameId: response?.game_id || "",
      gameMode: response?.game_mode || params.gameMode || "classic",
      botDifficulty: response?.bot_difficulty || params.difficulty || "easy",
      playUrl: response?.play_url || "",
      status: response?.status || "active",
      opponent: normalizeParticipant(response?.opponent),
    };
  } catch (error) {
    throw buildGameError(error, "Не удалось создать игру с роботом.");
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

async function postGameAction(gameId, pathSuffix, token, fallbackMessage) {
  try {
    const response = await apiFetch(
      `/api/v1/games/${encodeURIComponent(gameId)}${pathSuffix}`,
      {
        method: "POST",
        token,
      }
    );

    return {
      status: response?.status || "",
      gameId: response?.game_id || gameId,
      payload: response,
    };
  } catch (error) {
    throw buildGameError(error, fallbackMessage);
  }
}

export function resignGame(gameId, token) {
  return postGameAction(gameId, "/resign", token, "Не удалось сдаться.");
}

export function offerDraw(gameId, token) {
  return postGameAction(
    gameId,
    "/draw/offer",
    token,
    "Не удалось предложить ничью."
  );
}

export function acceptDrawOffer(gameId, token) {
  return postGameAction(
    gameId,
    "/draw/accept",
    token,
    "Не удалось принять ничью."
  );
}

export function declineDrawOffer(gameId, token) {
  return postGameAction(
    gameId,
    "/draw/decline",
    token,
    "Не удалось отклонить ничью."
  );
}
