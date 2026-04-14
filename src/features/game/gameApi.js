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
