const BOARD_SKIN_STORAGE_KEY = "meme-chess.board-skin";
const DEFAULT_BOARD_SKIN_ID = "board-skin-green";
const LEGACY_DEFAULT_BOARD_SKIN_ID = "board-skin-mono";

const BOARD_SKINS = {
  "board-skin-mono": {
    id: "board-skin-mono",
    title: "\u0427\u0435\u0440\u043d\u043e-\u0431\u0435\u043b\u0430\u044f",
    lightSquare: "#F4F4F4",
    darkSquare: "#1A1A1A",
  },
  "board-skin-burgundy": {
    id: "board-skin-burgundy",
    title: "\u0411\u043e\u0440\u0434\u043e\u0432\u043e-\u0431\u0435\u0436\u0435\u0432\u0430\u044f",
    lightSquare: "#D9C2A0",
    darkSquare: "#6B1F32",
  },
  "board-skin-rome": {
    id: "board-skin-burgundy",
    title: "\u0411\u043e\u0440\u0434\u043e\u0432\u043e-\u0431\u0435\u0436\u0435\u0432\u0430\u044f",
        lightSquare: "#e9d7bc",
        darkSquare: "#E5BA57",
  },
  "board-skin-halo": {
    id: "board-skin-burgundy",
    title: "\u0411\u043e\u0440\u0434\u043e\u0432\u043e-\u0431\u0435\u0436\u0435\u0432\u0430\u044f",
        lightSquare: "#5ad2f0",
        darkSquare: "#2d394b",
  },
  "board-skin-green": {
    id: "board-skin-green",
    title: "\u0421\u0435\u0440\u043e-\u0433\u043e\u043b\u0443\u0431\u0430\u044f",
    lightSquare: "#E8EDF9",
    darkSquare: "#B7C0D8",
  },
};

function readStoredBoardSkin() {
  if (typeof window === "undefined") {
    return DEFAULT_BOARD_SKIN_ID;
  }

  try {
    const storedValue = window.localStorage.getItem(BOARD_SKIN_STORAGE_KEY);
    if (storedValue === LEGACY_DEFAULT_BOARD_SKIN_ID) {
      return DEFAULT_BOARD_SKIN_ID;
    }
    return BOARD_SKINS[storedValue] ? storedValue : DEFAULT_BOARD_SKIN_ID;
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
  if (typeof window === "undefined" || !BOARD_SKINS[skinId]) {
    return;
  }

  try {
    window.localStorage.setItem(BOARD_SKIN_STORAGE_KEY, skinId);
    dispatchBoardSkinChange(skinId);
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
