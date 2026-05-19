import { useLayoutEffect, useRef } from "react";

import PlayerPanel from "../../../components/molecules/PlayerPanel.jsx";
import { useChessGame } from "../hooks/useChessGame.js";
import {
  BOARD_SIZE,
  BOTTOM_PLAYER_PANEL_GAP,
  DEFAULT_AVATAR,
  TOP_PLAYER_PANEL_GAP,
} from "../lib/boardConfig.js";
import GameBoard from "./GameBoard.jsx";

export default function ChessBoardSection({
  gameState,
  sendMove,
  boardWidth = BOARD_SIZE,
  onLayoutMetricsChange,
  topPlayerName = "Соперник",
  bottomPlayerName = "Вы",
  topPlayerAvatar = DEFAULT_AVATAR,
  bottomPlayerAvatar = DEFAULT_AVATAR,
  topPlayerProfileHref = "",
  bottomPlayerProfileHref = "",
  topReaction = null,
  bottomReaction = null,
  topPlayerTimer = null,
  bottomPlayerTimer = null,
  topPlayerTime = "15:00",
  bottomPlayerTime = "15:00",
  showPlayerTimers = true,
  topPlayerTimerTone = "idle",
  bottomPlayerTimerTone = "idle",
  topPlayerTimerActive = false,
  bottomPlayerTimerActive = false,
  topPlayerEmojiVolume = 0.5,
  onTopPlayerEmojiVolumeChange,
  boardOverlay = null,
  animateIntroPieces = false,
}) {
  const fallbackGameState = useChessGame();
  const gameStateLocal = gameState || fallbackGameState;
  const topPanelRef = useRef(null);
  const bottomPanelRef = useRef(null);

  const {
    game,
    displayedGame,
    highlightedSquares,
    boardOrientation,
    activeEffects,
    effectLayerVolume,
    removeEffect,
    promotionState,
    onPieceDragBegin,
    onPieceDragEnd,
    onSquareClick,
    onPieceDrop,
    onPromotionSelect,
    cancelPromotion,
    canDragPieces,
    isPieceDraggable,
  } = gameStateLocal;

  useLayoutEffect(() => {
    if (!onLayoutMetricsChange) {
      return undefined;
    }

    function reportMetrics() {
      onLayoutMetricsChange({
        topPanelHeight: topPanelRef.current?.offsetHeight || 0,
        bottomPanelHeight: bottomPanelRef.current?.offsetHeight || 0,
      });
    }

    reportMetrics();

    const resizeObserver = new ResizeObserver(reportMetrics);

    if (topPanelRef.current) {
      resizeObserver.observe(topPanelRef.current);
    }

    if (bottomPanelRef.current) {
      resizeObserver.observe(bottomPanelRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onLayoutMetricsChange, topPlayerName, bottomPlayerName]);

  return (
    <div className="flex min-h-0 items-start justify-start overflow-visible">
      <section
        className="flex flex-col"
        style={{
          width: boardWidth,
        }}
      >
        <div ref={topPanelRef} style={{ marginBottom: TOP_PLAYER_PANEL_GAP }}>
          <PlayerPanel
            name={topPlayerName}
            level=""
            avatar={topPlayerAvatar || DEFAULT_AVATAR}
            profileHref={topPlayerProfileHref}
            timer={topPlayerTimer}
            time={topPlayerTime}
            reaction={topReaction}
            showTimer={showPlayerTimers}
            timerTone={topPlayerTimerTone}
            timerIsActive={topPlayerTimerActive}
            emojiVolume={topPlayerEmojiVolume}
            onEmojiVolumeChange={onTopPlayerEmojiVolumeChange}
            showEmojiVolumeControl
          />
        </div>

        <GameBoard
          fen={(displayedGame || game).fen()}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          highlightedSquares={highlightedSquares}
          activeEffects={activeEffects}
          effectLayerVolume={effectLayerVolume}
          onEffectDone={removeEffect}
          promotionState={promotionState}
          onPieceDragBegin={(piece, square) => onPieceDragBegin(piece, square)}
          onPieceDragEnd={(piece, square) => onPieceDragEnd(piece, square)}
          onSquareClick={(square) => onSquareClick(square, sendMove)}
          onPieceDrop={(sourceSquare, targetSquare) =>
            onPieceDrop(sourceSquare, targetSquare, sendMove)
          }
          onPromotionSelect={(promotion) => onPromotionSelect(promotion, sendMove)}
          onPromotionCancel={cancelPromotion}
          canDragPieces={canDragPieces}
          isPieceDraggable={isPieceDraggable}
          overlayContent={boardOverlay}
          animateIntroPieces={animateIntroPieces}
        />

        <div ref={bottomPanelRef} style={{ marginTop: BOTTOM_PLAYER_PANEL_GAP }}>
          <PlayerPanel
            name={bottomPlayerName}
            level=""
            avatar={bottomPlayerAvatar || DEFAULT_AVATAR}
            profileHref={bottomPlayerProfileHref}
            timer={bottomPlayerTimer}
            time={bottomPlayerTime}
            reaction={bottomReaction}
            showTimer={showPlayerTimers}
            timerTone={bottomPlayerTimerTone}
            timerIsActive={bottomPlayerTimerActive}
          />
        </div>
      </section>
    </div>
  );
}
