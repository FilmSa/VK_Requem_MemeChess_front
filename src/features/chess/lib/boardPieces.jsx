import { withAssetBase } from "../../../shared/lib/assets.js";
import { DEFAULT_PIECE_SKIN_ID } from "../../../shared/lib/pieceSkin.js";

const makePiece = (src, alt) => ({ squareWidth, isDragging }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: squareWidth * 0.8,
      height: squareWidth * 0.8,
      margin: squareWidth * 0.1,
      opacity: isDragging ? 0.75 : 1,
      pointerEvents: "none",
      userSelect: "none",
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
  "piece-skin-imperium": {
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
};

function createCustomPieces(skinId = DEFAULT_PIECE_SKIN_ID) {
  const skin = pieceSkins[skinId] || pieceSkins[DEFAULT_PIECE_SKIN_ID];

  return {
    wK: makePiece(skin.wK, "wK"),
    wQ: makePiece(skin.wQ, "wQ"),
    wR: makePiece(skin.wR, "wR"),
    wB: makePiece(skin.wB, "wB"),
    wN: makePiece(skin.wN, "wN"),
    wP: makePiece(skin.wP, "wP"),
    bK: makePiece(skin.bK, "bK"),
    bQ: makePiece(skin.bQ, "bQ"),
    bR: makePiece(skin.bR, "bR"),
    bB: makePiece(skin.bB, "bB"),
    bN: makePiece(skin.bN, "bN"),
    bP: makePiece(skin.bP, "bP"),
  };
}

export const customPieces = createCustomPieces();
export { createCustomPieces };
