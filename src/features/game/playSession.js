const storageKeyPrefix = "meme-chess.play-session";

function buildStorageKey(gameId) {
  return `${storageKeyPrefix}.${gameId}`;
}

export function savePlaySession(session) {
  if (!session?.gameId) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      buildStorageKey(session.gameId),
      JSON.stringify(session)
    );
  } catch {
    // Ignore storage access failures and keep the session in memory only.
  }
}

export function readPlaySession(gameId) {
  if (!gameId) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(buildStorageKey(gameId));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed || parsed.gameId !== gameId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaySession(gameId) {
  if (!gameId) {
    return;
  }

  try {
    window.sessionStorage.removeItem(buildStorageKey(gameId));
  } catch {
    // Ignore storage access failures.
  }
}
