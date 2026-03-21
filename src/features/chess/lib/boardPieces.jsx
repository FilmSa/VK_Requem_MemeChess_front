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
  wK: makePiece("/pieces/wK.svg", "wK"),
  wQ: makePiece("/pieces/wQ.svg", "wQ"),
  wR: makePiece("/pieces/wR.svg", "wR"),
  wB: makePiece("/pieces/wB.svg", "wB"),
  wN: makePiece("/pieces/wN.svg", "wN"),
  wP: makePiece("/pieces/wP.svg", "wP"),
  bK: makePiece("/pieces/bK.svg", "bK"),
  bQ: makePiece("/pieces/bQ.svg", "bQ"),
  bR: makePiece("/pieces/bR.svg", "bR"),
  bB: makePiece("/pieces/bB.svg", "bB"),
  bN: makePiece("/pieces/bN.svg", "bN"),
  bP: makePiece("/pieces/bP.svg", "bP"),
};