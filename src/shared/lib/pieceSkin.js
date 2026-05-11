import {
  DEFAULT_PIECE_SKIN_SLUG,
  normalizePieceSkinSlug,
} from "../constants/customizationCatalog.js";

const PIECE_SKIN_STORAGE_KEY = "meme-chess.piece-skin";
const DEFAULT_PIECE_SKIN_ID = DEFAULT_PIECE_SKIN_SLUG;

function readStoredPieceSkin() {
  if (typeof window === "undefined") {
    return DEFAULT_PIECE_SKIN_ID;
  }

  try {
    const storedValue = window.localStorage.getItem(PIECE_SKIN_STORAGE_KEY);
    return normalizePieceSkinSlug(storedValue) || DEFAULT_PIECE_SKIN_ID;
  } catch {
    return DEFAULT_PIECE_SKIN_ID;
  }
}

function persistPieceSkin(skinId) {
  const normalizedSkinId = normalizePieceSkinSlug(skinId) || DEFAULT_PIECE_SKIN_ID;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PIECE_SKIN_STORAGE_KEY, normalizedSkinId);
    dispatchPieceSkinChange(normalizedSkinId);
  } catch {
    // Ignore storage failures.
  }
}

function dispatchPieceSkinChange(skinId) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  const event = new CustomEvent("meme-chess-piece-skin-change", {
    detail: { skinId },
  });
  window.dispatchEvent(event);
}

function subscribePieceSkinChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    if (!event || !event.detail) {
      return;
    }

    callback(event.detail.skinId);
  };

  window.addEventListener("meme-chess-piece-skin-change", listener);

  return () => {
    window.removeEventListener("meme-chess-piece-skin-change", listener);
  };
}

export { DEFAULT_PIECE_SKIN_ID, readStoredPieceSkin, persistPieceSkin, subscribePieceSkinChanges };
