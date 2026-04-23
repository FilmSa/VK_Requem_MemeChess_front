import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { createCustomPieces } from "../lib/boardPieces.jsx";
import { readStoredPieceSkin, subscribePieceSkinChanges } from "../../../shared/lib/pieceSkin.js";
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
  const [selectedPieceSkin, setSelectedPieceSkin] = useState(
    () => readStoredPieceSkin()
  );

  useEffect(() => {
    return subscribePieceSkinChanges((skinId) => {
      setSelectedPieceSkin(skinId);
    });
  }, []);

  const customPieces = useMemo(
    () => createCustomPieces(selectedPieceSkin),
    [selectedPieceSkin]
  );

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
