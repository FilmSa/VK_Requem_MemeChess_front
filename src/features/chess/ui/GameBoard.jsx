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

const BOARD_MOVE_ANIMATION_DURATION_MS = 920;

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  activeEffects,
  promotionState,
  onSquareClick,
  onPieceDrop,
  onPromotionSelect,
  onPromotionCancel,
  canDragPieces,
  isPieceDraggable,
  overlayContent = null,
  animateIntroPieces = false,
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
    () =>
      createCustomPieces(selectedPieceSkin, {
        animateIntro: animateIntroPieces,
      }),
    [animateIntroPieces, selectedPieceSkin]
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
      className="relative"
      style={{
        width: boardWidth,
        height: boardWidth,
      }}
    >
      <div
        className="game-board"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Chessboard
          id="PawnRequiemBoard"
          position={fen}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          animationDuration={BOARD_MOVE_ANIMATION_DURATION_MS}
          arePiecesDraggable={canDragPieces}
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

      {overlayContent ? overlayContent : null}
    </div>
  );
}
