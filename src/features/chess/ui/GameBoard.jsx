import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { createCustomPieces } from "../lib/boardPieces.jsx";
import { BOARD_MOVE_ANIMATION_DURATION_MS } from "../lib/boardConfig.js";
import { readStoredPieceSkin, subscribePieceSkinChanges } from "../../../shared/lib/pieceSkin.js";
import {
  getBoardSkinConfig,
  readStoredBoardSkin,
  subscribeBoardSkinChanges,
} from "../../../shared/lib/boardSkin.js";
import BoardEffectsLayer from "../media/BoardEffectsLayer.jsx";
import PromotionMenu from "./PromotionMenu.jsx";

function extractBoardPosition(fen) {
  const normalizedFen = String(fen || "").trim();

  if (!normalizedFen) {
    return "start";
  }

  return normalizedFen.split(/\s+/)[0] || "start";
}

export default function GameBoard({
  fen,
  boardWidth,
  boardOrientation,
  highlightedSquares,
  activeEffects,
  effectLayerVolume = 1,
  onEffectDone,
  promotionState,
  onSquareClick,
  onPieceDrop,
  onPieceDragBegin,
  onPieceDragEnd,
  onPromotionSelect,
  onPromotionCancel,
  canDragPieces,
  isPieceDraggable,
  overlayContent = null,
  animateIntroPieces = false,
  whitePieceSkinId = "",
  blackPieceSkinId = "",
  boardSkinId = "",
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
      createCustomPieces(
        {
          whiteSkinId: whitePieceSkinId || selectedPieceSkin,
          blackSkinId: blackPieceSkinId || selectedPieceSkin,
        },
        {
          animateIntro: animateIntroPieces,
        }
      ),
    [animateIntroPieces, blackPieceSkinId, selectedPieceSkin, whitePieceSkinId]
  );
  const boardSkinConfig = useMemo(
    () => getBoardSkinConfig(boardSkinId || selectedBoardSkin),
    [boardSkinId, selectedBoardSkin]
  );
  const boardPosition = useMemo(() => extractBoardPosition(fen), [fen]);

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
          position={boardPosition}
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
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
        />

        <BoardEffectsLayer
          activeEffects={activeEffects}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          layerVolume={effectLayerVolume}
          onEffectDone={onEffectDone}
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
