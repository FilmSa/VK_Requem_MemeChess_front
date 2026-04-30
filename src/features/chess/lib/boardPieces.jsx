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
  "piece-skin-ROME": {
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
  "piece-skin-Halo": {
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
  "piece-skin-Lotr": {
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
