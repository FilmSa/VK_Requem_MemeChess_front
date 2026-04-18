import { Chessboard } from "react-chessboard";
import { customPieces } from "../lib/boardPieces.jsx";
import BoardEffectsLayer from "../media/BoardEffectsLayer.jsx";

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  activeEffects,
  onSquareClick,
  onPieceDrop,
}) {
  if (!boardWidth) {
    return null;
  }

  return (
    <div
      className="game-board"
      style={{
        width: boardWidth,
        height: boardWidth,
      }}
    >
      <Chessboard
        id="PawnRequiemBoard"
        position={fen}
        boardOrientation={boardOrientation}
        boardWidth={boardWidth}
        customPieces={customPieces}
        customLightSquareStyle={{ backgroundColor: "#c8cfdb" }}
        customDarkSquareStyle={{ backgroundColor: "#aab3c8" }}
        customSquareStyles={highlightedSquares}
        onSquareClick={onSquareClick}
        onPieceDrop={onPieceDrop}
      />

      <BoardEffectsLayer
        activeEffects={activeEffects}
        boardWidth={boardWidth}
        boardOrientation={boardOrientation}
      />
    </div>
  );
}
