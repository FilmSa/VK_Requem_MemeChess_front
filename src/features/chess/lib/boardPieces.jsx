import { withAssetBase } from "../../../shared/lib/assets.js";

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

export const customPieces = {
  wK: makePiece(withAssetBase("/pieces/wK.svg"), "wK"),
  wQ: makePiece(withAssetBase("/pieces/wQ.svg"), "wQ"),
  wR: makePiece(withAssetBase("/pieces/wR.svg"), "wR"),
  wB: makePiece(withAssetBase("/pieces/wB.svg"), "wB"),
  wN: makePiece(withAssetBase("/pieces/wN.svg"), "wN"),
  wP: makePiece(withAssetBase("/pieces/wP.svg"), "wP"),
  bK: makePiece(withAssetBase("/pieces/bK.svg"), "bK"),
  bQ: makePiece(withAssetBase("/pieces/bQ.svg"), "bQ"),
  bR: makePiece(withAssetBase("/pieces/bR.svg"), "bR"),
  bB: makePiece(withAssetBase("/pieces/bB.svg"), "bB"),
  bN: makePiece(withAssetBase("/pieces/bN.svg"), "bN"),
  bP: makePiece(withAssetBase("/pieces/bP.svg"), "bP"),
};
