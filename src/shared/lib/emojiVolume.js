const EMOJI_VOLUME_STORAGE_KEY = "meme-chess.emoji-volume";
const EMOJI_VOLUME_CHANGE_EVENT = "meme-chess-emoji-volume-change";
const DEFAULT_EMOJI_VOLUME = 0.5;

function clampEmojiVolume(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_EMOJI_VOLUME;
  }

  return Math.min(1, Math.max(0, numericValue));
}

export function readStoredEmojiVolume() {
  if (typeof window === "undefined") {
    return DEFAULT_EMOJI_VOLUME;
  }

  try {
    const storedValue = window.localStorage.getItem(EMOJI_VOLUME_STORAGE_KEY);

    if (storedValue === null) {
      return DEFAULT_EMOJI_VOLUME;
    }

    return clampEmojiVolume(Number.parseFloat(storedValue));
  } catch {
    // Ignore storage access failures.
  }

  return DEFAULT_EMOJI_VOLUME;
}

function dispatchEmojiVolumeChange(volume) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(EMOJI_VOLUME_CHANGE_EVENT, {
      detail: {
        volume,
      },
    })
  );
}

export function persistEmojiVolume(volume) {
  const normalizedVolume = clampEmojiVolume(volume);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      EMOJI_VOLUME_STORAGE_KEY,
      String(normalizedVolume)
    );
  } catch {
    // Ignore storage access failures.
  }

  dispatchEmojiVolumeChange(normalizedVolume);
}

export function subscribeEmojiVolumeChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    callback(clampEmojiVolume(event?.detail?.volume));
  };

  window.addEventListener(EMOJI_VOLUME_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(EMOJI_VOLUME_CHANGE_EVENT, listener);
  };
}
