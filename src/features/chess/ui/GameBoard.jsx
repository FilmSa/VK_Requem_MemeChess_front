import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { createCustomPieces } from "../lib/boardPieces.jsx";
import { readStoredPieceSkin, subscribePieceSkinChanges } from "../../../shared/lib/pieceSkin.js";
import {
  getBoardSkinConfig,
  readStoredBoardSkin,
  subscribeBoardSkinChanges,
} from "../../../shared/lib/boardSkin.js";
import BoardEffectsLayer from "../media/BoardEffectsLayer.jsx";
import PromotionMenu from "./PromotionMenu.jsx";

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  customArrows,
  activeEffects,
  promotionState,
  onSquareClick,
  onPieceDrop,
  onPromotionSelect,
  onPromotionCancel,
  canDragPieces,
  isPieceDraggable,
}) {
  const [selectedPieceSkin, setSelectedPieceSkin] = useState(
    () => readStoredPieceSkin()
  );
  const [selectedBoardSkin, setSelectedBoardSkin] = useState(
    () => readStoredBoardSkin()
  );

  useEffect(() => {
    return subscribePieceSkinChanges((skinId) => {
      setSelectedPieceSkin(skinId);
    });
  }, []);

  useEffect(() => {
    return subscribeBoardSkinChanges((skinId) => {
      setSelectedBoardSkin(skinId);
    });
  }, []);

  const customPieces = useMemo(
    () => createCustomPieces(selectedPieceSkin),
    [selectedPieceSkin]
  );
  const boardSkinConfig = useMemo(
    () => getBoardSkinConfig(selectedBoardSkin),
    [selectedBoardSkin]
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
        animationDuration={750}
        arePiecesDraggable={canDragPieces}
        customArrows={customArrows}
        customPieces={customPieces}
        customLightSquareStyle={{ backgroundColor: boardSkinConfig.lightSquare }}
        customDarkSquareStyle={{ backgroundColor: boardSkinConfig.darkSquare }}
        customSquareStyles={highlightedSquares}
        isDraggablePiece={isPieceDraggable}
        onPromotionCheck={() => false}
        onSquareClick={onSquareClick}
        onPieceDrop={onPieceDrop}
      />

      <BoardEffectsLayer
        activeEffects={activeEffects}
        boardWidth={boardWidth}
        boardOrientation={boardOrientation}
      />

      <PromotionMenu
        boardWidth={boardWidth}
        customPieces={customPieces}
        promotionState={promotionState}
        onSelect={onPromotionSelect}
        onCancel={onPromotionCancel}
      />
    </div>
  );
}
