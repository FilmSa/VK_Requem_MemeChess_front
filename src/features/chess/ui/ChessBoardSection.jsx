import PlayerPanel from "../../../components/molecules/PlayerPanel.jsx";
import { useChessGame } from "../hooks/useChessGame.js";
import { BOARD_SIZE, DEFAULT_AVATAR } from "../lib/boardConfig.js";
import GameBoard from "./GameBoard.jsx";

export default function ChessBoardSection({
  gameState,
  sendMove,
  topPlayerName = "Соперник",
  bottomPlayerName = "Вы",
  topPlayerAvatar = DEFAULT_AVATAR,
  bottomPlayerAvatar = DEFAULT_AVATAR,
  topReaction = null,
  bottomReaction = null,
}) {
  const fallbackGameState = useChessGame();
  const gameStateLocal = gameState || fallbackGameState;

  const {
    game,
    displayedGame,
    highlightedSquares,
    boardOrientation,
    activeEffects,
    onSquareClick,
    onPieceDrop,
  } = gameStateLocal;

  return (
    <div className="flex items-start justify-start overflow-visible">
      <div className="flex flex-row items-start gap-4">
        <section className="flex flex-col" style={{ width: BOARD_SIZE }}>
          <div className="mb-[26px]">
            <PlayerPanel
              name={topPlayerName}
              level=""
              avatar={topPlayerAvatar || DEFAULT_AVATAR}
              time="15:00"
              reaction={topReaction}
            />
          </div>

          <GameBoard
            fen={(displayedGame || game).fen()}
            boardWidth={BOARD_SIZE}
            boardOrientation={boardOrientation}
            highlightedSquares={highlightedSquares}
            activeEffects={activeEffects}
            onSquareClick={(square) => onSquareClick(square, sendMove)}
            onPieceDrop={(sourceSquare, targetSquare) =>
              onPieceDrop(sourceSquare, targetSquare, sendMove)
            }
          />

          <div className="mt-[18px]">
            <PlayerPanel
              name={bottomPlayerName}
              level=""
              avatar={bottomPlayerAvatar || DEFAULT_AVATAR}
              time="15:00"
              reaction={bottomReaction}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
