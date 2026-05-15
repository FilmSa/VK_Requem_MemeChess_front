import { withAssetBase } from "../../../shared/lib/assets.js";
import { DEFAULT_PIECE_SKIN_ID } from "../../../shared/lib/pieceSkin.js";

function resolveIntroDelay(square) {
  if (typeof square !== "string" || square.length < 2) {
    return 0;
  }

  const file = square[0]?.toLowerCase();
  const rank = Number.parseInt(square[1], 10);
  const fileIndex = Math.max(0, "abcdefgh".indexOf(file));
  const rankBand = [8, 7, 2, 1].indexOf(rank);
  const safeRankBand = rankBand >= 0 ? rankBand : 0;

  return fileIndex * 60 + safeRankBand * 18;
}

const makePiece =
  (src, alt, { animateIntro = false } = {}) =>
  ({ squareWidth, isDragging, square }) => (
    <img
      src={src}
      alt={alt}
      className={animateIntro ? "board-piece-image board-piece-image--intro" : "board-piece-image"}
      style={{
        width: squareWidth * 0.8,
        height: squareWidth * 0.8,
        margin: squareWidth * 0.1,
        opacity: isDragging ? 0.75 : 1,
        pointerEvents: "none",
        userSelect: "none",
        transformOrigin: "50% 100%",
        animationDelay: animateIntro ? `${resolveIntroDelay(square)}ms` : undefined,
      }}
    />
  );

const pieceSkins = {
  [DEFAULT_PIECE_SKIN_ID]: {
    wK: withAssetBase("/pieces/wK.svg"),
    wQ: withAssetBase("/pieces/wQ.svg"),
    wR: withAssetBase("/pieces/wR.svg"),
    wB: withAssetBase("/pieces/wB.svg"),
    wN: withAssetBase("/pieces/wN.svg"),
    wP: withAssetBase("/pieces/wP.svg"),
    bK: withAssetBase("/pieces/bK.svg"),
    bQ: withAssetBase("/pieces/bQ.svg"),
    bR: withAssetBase("/pieces/bR.svg"),
    bB: withAssetBase("/pieces/bB.svg"),
    bN: withAssetBase("/pieces/bN.svg"),
    bP: withAssetBase("/pieces/bP.svg"),
  },
  "piece.imperium": {
    wK: withAssetBase("/pieces/imperium/wK.svg"),
    wQ: withAssetBase("/pieces/imperium/wQ.svg"),
    wR: withAssetBase("/pieces/imperium/wR.svg"),
    wB: withAssetBase("/pieces/imperium/wB.svg"),
    wN: withAssetBase("/pieces/imperium/wN.svg"),
    wP: withAssetBase("/pieces/imperium/wP.svg"),
    bK: withAssetBase("/pieces/imperium/bK.svg"),
    bQ: withAssetBase("/pieces/imperium/bQ.svg"),
    bR: withAssetBase("/pieces/imperium/bR.svg"),
    bB: withAssetBase("/pieces/imperium/bB.svg"),
    bN: withAssetBase("/pieces/imperium/bN.svg"),
    bP: withAssetBase("/pieces/imperium/bP.svg"),
  },
  "piece.rome": {
    wK: withAssetBase("/pieces/rome/wK.svg"),
    wQ: withAssetBase("/pieces/rome/wQ.svg"),
    wR: withAssetBase("/pieces/rome/wR.svg"),
    wB: withAssetBase("/pieces/rome/wB.svg"),
    wN: withAssetBase("/pieces/rome/wN.svg"),
    wP: withAssetBase("/pieces/rome/wP.svg"),
    bK: withAssetBase("/pieces/rome/bK.svg"),
    bQ: withAssetBase("/pieces/rome/bQ.svg"),
    bR: withAssetBase("/pieces/rome/bR.svg"),
    bB: withAssetBase("/pieces/rome/bB.svg"),
    bN: withAssetBase("/pieces/rome/bN.svg"),
    bP: withAssetBase("/pieces/rome/bP.svg"),
  },
  "piece.halo": {
    wK: withAssetBase("/pieces/Halo/wK.svg"),
    wQ: withAssetBase("/pieces/Halo/wQ.svg"),
    wR: withAssetBase("/pieces/Halo/wR.svg"),
    wB: withAssetBase("/pieces/Halo/wB.svg"),
    wN: withAssetBase("/pieces/Halo/wN.svg"),
    wP: withAssetBase("/pieces/Halo/wP.svg"),
    bK: withAssetBase("/pieces/Halo/bK.svg"),
    bQ: withAssetBase("/pieces/Halo/bQ.svg"),
    bR: withAssetBase("/pieces/Halo/bR.svg"),
    bB: withAssetBase("/pieces/Halo/bB.svg"),
    bN: withAssetBase("/pieces/Halo/bN.svg"),
    bP: withAssetBase("/pieces/Halo/bP.svg"),
  },
  "piece.lotr": {
    wK: withAssetBase("/pieces/Lotr/wK.svg"),
    wQ: withAssetBase("/pieces/Lotr/wQ.svg"),
    wR: withAssetBase("/pieces/Lotr/wR.svg"),
    wB: withAssetBase("/pieces/Lotr/wB.svg"),
    wN: withAssetBase("/pieces/Lotr/wN.svg"),
    wP: withAssetBase("/pieces/Lotr/wP.svg"),
    bK: withAssetBase("/pieces/Lotr/bK.svg"),
    bQ: withAssetBase("/pieces/Lotr/bQ.svg"),
    bR: withAssetBase("/pieces/Lotr/bR.svg"),
    bB: withAssetBase("/pieces/Lotr/bB.svg"),
    bN: withAssetBase("/pieces/Lotr/bN.svg"),
    bP: withAssetBase("/pieces/Lotr/bP.svg"),
  },
};

function createCustomPieces(skinId = DEFAULT_PIECE_SKIN_ID, options = {}) {
  const skin = pieceSkins[skinId] || pieceSkins[DEFAULT_PIECE_SKIN_ID];

  return {
    wK: makePiece(skin.wK, "wK", options),
    wQ: makePiece(skin.wQ, "wQ", options),
    wR: makePiece(skin.wR, "wR", options),
    wB: makePiece(skin.wB, "wB", options),
    wN: makePiece(skin.wN, "wN", options),
    wP: makePiece(skin.wP, "wP", options),
    bK: makePiece(skin.bK, "bK", options),
    bQ: makePiece(skin.bQ, "bQ", options),
    bR: makePiece(skin.bR, "bR", options),
    bB: makePiece(skin.bB, "bB", options),
    bN: makePiece(skin.bN, "bN", options),
    bP: makePiece(skin.bP, "bP", options),
  };
}

function getPieceSkinAssets(skinId = DEFAULT_PIECE_SKIN_ID) {
  return pieceSkins[skinId] || pieceSkins[DEFAULT_PIECE_SKIN_ID];
}

export const customPieces = createCustomPieces();
export { createCustomPieces, getPieceSkinAssets };
