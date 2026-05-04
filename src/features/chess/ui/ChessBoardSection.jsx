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
  topReaction = null,
  bottomReaction = null,
  topPlayerTime = "15:00",
  bottomPlayerTime = "15:00",
  showPlayerTimers = true,
  topPlayerTimerTone = "idle",
  bottomPlayerTimerTone = "idle",
  topPlayerTimerActive = false,
  bottomPlayerTimerActive = false,
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
    promotionState,
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
    <div className="flex h-full min-h-0 items-start justify-start overflow-visible">
      <section
        className="flex h-full flex-col"
        style={{
          width: boardWidth,
        }}
      >
        <div
          ref={topPanelRef}
          style={{ marginBottom: TOP_PLAYER_PANEL_GAP }}
        >
          <PlayerPanel
            name={topPlayerName}
            level=""
            avatar={topPlayerAvatar || DEFAULT_AVATAR}
            time={topPlayerTime}
            reaction={topReaction}
            showTimer={showPlayerTimers}
            timerTone={topPlayerTimerTone}
            timerIsActive={topPlayerTimerActive}
          />
        </div>

        <GameBoard
          fen={(displayedGame || game).fen()}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          highlightedSquares={highlightedSquares}
          activeEffects={activeEffects}
          promotionState={promotionState}
          onSquareClick={(square) => onSquareClick(square, sendMove)}
          onPieceDrop={(sourceSquare, targetSquare) =>
            onPieceDrop(sourceSquare, targetSquare, sendMove)
          }
          onPromotionSelect={(promotion) => onPromotionSelect(promotion, sendMove)}
          onPromotionCancel={cancelPromotion}
          canDragPieces={canDragPieces}
          isPieceDraggable={isPieceDraggable}
        />

        <div
          ref={bottomPanelRef}
          style={{ marginTop: BOTTOM_PLAYER_PANEL_GAP }}
        >
          <PlayerPanel
            name={bottomPlayerName}
            level=""
            avatar={bottomPlayerAvatar || DEFAULT_AVATAR}
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
