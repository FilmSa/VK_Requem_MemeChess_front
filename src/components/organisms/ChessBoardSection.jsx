import PlayerPanel from "../molecules/PlayerPanel.jsx";
import GameBoard from "../../features/chess/components/GameBoard.jsx";
import MoveHistoryPanel from "../molecules/MoveHistoryPanel.jsx";
import { useBoardScale } from "../../features/chess/hooks/useBoardScale.js";
import { useChessGame } from "../../features/chess/hooks/useChessGame.js";
import { useGameSocket } from "../../features/chess/hooks/useGameSocket.js";
import { BOARD_SIZE, DEFAULT_AVATAR } from "../../features/chess/lib/boardConfig.js";

export default function ChessBoardSection() {
  const { scale, boardWidth } = useBoardScale(BOARD_SIZE);

  const {
    game,
    highlightedSquares,
    boardOrientation,
    onSquareClick,
    onPieceDrop,
    applyRemoteMove,
  } = useChessGame();

  const { sendMove } = useGameSocket({
    onRemoteMove: applyRemoteMove,
  });

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          width: `${boardWidth}px`,
        }}
      >
        <section
          className="flex flex-col"
          style={{ width: Math.floor(BOARD_SIZE * scale) }}
        >
          <div className="mb-[26px]">
            <PlayerPanel
              name="Противник"
              level="??? lvl"
              avatar={DEFAULT_AVATAR}
              time="15:00"
            />
          </div>

          <GameBoard
            fen={game.fen()}
            boardWidth={boardWidth}
            boardOrientation={boardOrientation}
            highlightedSquares={highlightedSquares}
            onSquareClick={(square) => onSquareClick(square, sendMove)}
            onPieceDrop={(sourceSquare, targetSquare) =>
              onPieceDrop(sourceSquare, targetSquare, sendMove)
            }
          />

          <div className="mt-[18px]">
            <PlayerPanel
              name="ChessMaster"
              level="14 lvl"
              avatar="/icons/avatar.jpg"
              time="15:00"
            />
          </div>
        </section>

        <div className="flex-shrink-0" style={{ width: "220px", height: Math.floor(BOARD_SIZE * scale), marginTop: "54px" }}>
          <MoveHistoryPanel history={game.history()} height="450px" />
        </div>
      </div>
    </div>
  );
}