import { Chessboard } from "react-chessboard";
import { customPieces } from "../lib/boardPieces.jsx";

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  onSquareClick,
  onPieceDrop,
}) {
  return (
    <div
      className="overflow-hidden rounded-[16px]"
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
    </div>
  );
}