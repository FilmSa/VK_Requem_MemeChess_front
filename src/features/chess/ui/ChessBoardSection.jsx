import PlayerPanel from "../../../components/molecules/PlayerPanel.jsx";
import { useGameSocket } from "../hooks/useGameSocket.js";
import { useChessGame } from "../hooks/useChessGame.js";
import { BOARD_SIZE, DEFAULT_AVATAR } from "../lib/boardConfig.js";
import GameBoard from "./GameBoard.jsx";

export default function ChessBoardSection({
  gameState,
  enableSocket = true,
  socketOptions,
  topPlayerName = "\u0421\u043e\u043f\u0435\u0440\u043d\u0438\u043a",
  bottomPlayerName = "\u0412\u044b",
  topPlayerAvatar = DEFAULT_AVATAR,
  bottomPlayerAvatar = DEFAULT_AVATAR,
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
    applyRemoteMove,
  } = gameStateLocal;

  const { sendMove } = useGameSocket({
    onRemoteMove: applyRemoteMove,
    onStateChange: socketOptions?.onStateChange,
    onJoined: socketOptions?.onJoined,
    onOpen: socketOptions?.onOpen,
    onClose: socketOptions?.onClose,
    onError: socketOptions?.onError,
    enabled: enableSocket,
    gameId: socketOptions?.gameId,
    userId: socketOptions?.userId,
    token: socketOptions?.token,
    allowDebugToken: socketOptions?.allowDebugToken,
  });

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
            />
          </div>
        </section>
      </div>
    </div>
  );
}
