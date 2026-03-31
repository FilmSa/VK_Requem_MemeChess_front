import { Chessboard } from "react-chessboard";
import { customPieces } from "../lib/boardPieces.jsx";
import BoardEffectsLayer from "./BoardEffectsLayer.jsx";

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  activeEffects,
  onSquareClick,
  onPieceDrop,
}) {
  console.log("GameBoard activeEffects", activeEffects);
  return (
    <div
      className="overflow-hidden rounded-[16px]"
      style={{
        position: "relative",
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