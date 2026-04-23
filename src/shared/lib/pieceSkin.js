const PIECE_SKIN_STORAGE_KEY = "meme-chess.piece-skin";
const DEFAULT_PIECE_SKIN_ID = "piece-skin-default";

function readStoredPieceSkin() {
  if (typeof window === "undefined") {
    return DEFAULT_PIECE_SKIN_ID;
  }

  try {
    const storedValue = window.localStorage.getItem(PIECE_SKIN_STORAGE_KEY);
    return storedValue || DEFAULT_PIECE_SKIN_ID;
  } catch {
    return DEFAULT_PIECE_SKIN_ID;
  }
}

function persistPieceSkin(skinId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PIECE_SKIN_STORAGE_KEY, skinId);
    dispatchPieceSkinChange(skinId);
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
