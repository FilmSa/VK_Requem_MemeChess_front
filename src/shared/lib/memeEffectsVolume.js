const MEME_EFFECTS_VOLUME_STORAGE_KEY = "meme-chess.meme-effects-volume";
const MEME_EFFECTS_VOLUME_CHANGE_EVENT = "meme-chess-meme-effects-volume-change";
const DEFAULT_MEME_EFFECTS_VOLUME = 0.5;

function clampMemeEffectsVolume(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MEME_EFFECTS_VOLUME;
  }

  return Math.min(1, Math.max(0, numericValue));
}

export function readStoredMemeEffectsVolume() {
  if (typeof window === "undefined") {
    return DEFAULT_MEME_EFFECTS_VOLUME;
  }

  try {
    const storedValue = window.localStorage.getItem(MEME_EFFECTS_VOLUME_STORAGE_KEY);

    if (storedValue === null) {
      return DEFAULT_MEME_EFFECTS_VOLUME;
    }

    return clampMemeEffectsVolume(Number.parseFloat(storedValue));
  } catch {
    // Ignore storage access failures.
  }

  return DEFAULT_MEME_EFFECTS_VOLUME;
}

function dispatchMemeEffectsVolumeChange(volume) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(MEME_EFFECTS_VOLUME_CHANGE_EVENT, {
      detail: {
        volume,
      },
    })
  );
}

export function persistMemeEffectsVolume(volume) {
  const normalizedVolume = clampMemeEffectsVolume(volume);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      MEME_EFFECTS_VOLUME_STORAGE_KEY,
      String(normalizedVolume)
    );
  } catch {
    // Ignore storage access failures.
  }

  dispatchMemeEffectsVolumeChange(normalizedVolume);
}

export function subscribeMemeEffectsVolumeChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    callback(clampMemeEffectsVolume(event?.detail?.volume));
  };

  window.addEventListener(MEME_EFFECTS_VOLUME_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(MEME_EFFECTS_VOLUME_CHANGE_EVENT, listener);
  };
}
