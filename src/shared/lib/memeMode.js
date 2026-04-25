const MEME_MODE_STORAGE_KEY = "meme-chess.meme-mode";
const MEME_MODE_CHANGE_EVENT = "meme-chess-meme-mode-change";
const DEFAULT_MEME_MODE_ENABLED = true;

export function readStoredMemeMode() {
  if (typeof window === "undefined") {
    return DEFAULT_MEME_MODE_ENABLED;
  }

  try {
    const storedValue = window.localStorage.getItem(MEME_MODE_STORAGE_KEY);

    if (storedValue === "false") {
      return false;
    }

    if (storedValue === "true") {
      return true;
    }
  } catch {
    // Ignore storage access failures.
  }

  return DEFAULT_MEME_MODE_ENABLED;
}

function dispatchMemeModeChange(enabled) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(MEME_MODE_CHANGE_EVENT, {
      detail: { enabled },
    })
  );
}

export function persistMemeMode(enabled) {
  const normalizedValue = Boolean(enabled);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MEME_MODE_STORAGE_KEY, String(normalizedValue));
  } catch {
    // Ignore storage access failures.
  }

  dispatchMemeModeChange(normalizedValue);
}

export function subscribeMemeModeChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    callback(Boolean(event?.detail?.enabled));
  };

  window.addEventListener(MEME_MODE_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(MEME_MODE_CHANGE_EVENT, listener);
  };
}
