const LOCAL_BOT_STORAGE_KEY_PREFIX = "meme-chess.local-bot";

function buildStorageKey(gameId) {
  return `${LOCAL_BOT_STORAGE_KEY_PREFIX}.${gameId}`;
}

export function saveLocalBotGameState(gameId, roomState) {
  if (!gameId || !roomState) {
    return;
  }

  try {
    window.localStorage.setItem(
      buildStorageKey(gameId),
      JSON.stringify(roomState)
    );
  } catch {
    // Ignore storage access failures and keep the room in memory only.
  }
}

export function readLocalBotGameState(gameId) {
  if (!gameId) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(buildStorageKey(gameId));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed || parsed.game_id !== gameId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalBotGameState(gameId) {
  if (!gameId) {
    return;
  }

  try {
    window.localStorage.removeItem(buildStorageKey(gameId));
  } catch {
    // Ignore storage access failures.
  }
}
