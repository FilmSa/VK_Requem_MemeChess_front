import {
  BOARD_CATALOG_ITEMS,
  DEFAULT_BOARD_SKIN_SLUG,
  normalizeBoardSkinSlug,
} from "../constants/customizationCatalog.js";

const BOARD_SKIN_STORAGE_KEY = "meme-chess.board-skin";
const DEFAULT_BOARD_SKIN_ID = DEFAULT_BOARD_SKIN_SLUG;
const BOARD_SKINS = Object.fromEntries(
  BOARD_CATALOG_ITEMS.map((item) => [
    item.slug,
    {
      id: item.slug,
      title: item.title,
      lightSquare: item.lightSquare,
      darkSquare: item.darkSquare,
    },
  ])
);

function readStoredBoardSkin() {
  if (typeof window === "undefined") {
    return DEFAULT_BOARD_SKIN_ID;
  }

  try {
    const storedValue = window.localStorage.getItem(BOARD_SKIN_STORAGE_KEY);
    const normalizedSkinId =
      normalizeBoardSkinSlug(storedValue) || DEFAULT_BOARD_SKIN_ID;
    return BOARD_SKINS[normalizedSkinId] ? normalizedSkinId : DEFAULT_BOARD_SKIN_ID;
  } catch {
    return DEFAULT_BOARD_SKIN_ID;
  }
}

function dispatchBoardSkinChange(skinId) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  const event = new CustomEvent("meme-chess-board-skin-change", {
    detail: { skinId },
  });
  window.dispatchEvent(event);
}

function persistBoardSkin(skinId) {
  const normalizedSkinId =
    normalizeBoardSkinSlug(skinId) || DEFAULT_BOARD_SKIN_ID;

  if (typeof window === "undefined" || !BOARD_SKINS[normalizedSkinId]) {
    return;
  }

  try {
    window.localStorage.setItem(BOARD_SKIN_STORAGE_KEY, normalizedSkinId);
    dispatchBoardSkinChange(normalizedSkinId);
  } catch {
  }
}

function subscribeBoardSkinChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    if (!event?.detail?.skinId) {
      return;
    }

    callback(event.detail.skinId);
  };

  window.addEventListener("meme-chess-board-skin-change", listener);

  return () => {
    window.removeEventListener("meme-chess-board-skin-change", listener);
  };
}

function getBoardSkinConfig(skinId) {
  return BOARD_SKINS[skinId] || BOARD_SKINS[DEFAULT_BOARD_SKIN_ID];
}

export {
  BOARD_SKINS,
  DEFAULT_BOARD_SKIN_ID,
  getBoardSkinConfig,
  persistBoardSkin,
  readStoredBoardSkin,
  subscribeBoardSkinChanges,
};
