import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import UserInfo from "../molecules/UserInfo";

const BOARD_SIZE = 834;
const DEFAULT_AVATAR = "/images/default-avatar.png";

const makePiece = (src, alt) => ({ squareWidth, isDragging }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: squareWidth * 0.8,
      height: squareWidth * 0.8,
      margin: squareWidth * 0.1,
      opacity: isDragging ? 0.75 : 1,
      pointerEvents: "none",
      userSelect: "none",
    }}
  />
);

const customPieces = {
  wK: makePiece("/pieces/wK.svg", "wK"),
  wQ: makePiece("/pieces/wQ.svg", "wQ"),
  wR: makePiece("/pieces/wR.svg", "wR"),
  wB: makePiece("/pieces/wB.svg", "wB"),
  wN: makePiece("/pieces/wN.svg", "wN"),
  wP: makePiece("/pieces/wP.svg", "wP"),
  bK: makePiece("/pieces/bK.svg", "bK"),
  bQ: makePiece("/pieces/bQ.svg", "bQ"),
  bR: makePiece("/pieces/bR.svg", "bR"),
  bB: makePiece("/pieces/bB.svg", "bB"),
  bN: makePiece("/pieces/bN.svg", "bN"),
  bP: makePiece("/pieces/bP.svg", "bP"),
};

function Timer({ time = "15:00" }) {
  return (
    <div
      className="
        w-[138px]
        h-[44px]
        rounded-[20px_0px]
        bg-[#070d34]
        shadow-[0_4px_10px_rgba(0,0,0,0.35)]
        flex
        items-center
        justify-center
        text-white
        text-[22px]
        leading-none
        font-medium
        text-[#ffffff]
      "
      style={{ fontFamily: '"Unbounded", sans-serif' }}
    >
      {time}
    </div>
  );
}

export default function ChessBoardSection() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const horizontalPadding = 80;
      const verticalPadding = 80;

      const designWidth = 834;
      const designHeight = 54 + 26 + 834 + 18 + 54;

      const availableWidth = window.innerWidth - horizontalPadding;
      const availableHeight = window.innerHeight - verticalPadding;

      const scaleX = availableWidth / designWidth;
      const scaleY = availableHeight / designHeight;

      const nextScale = Math.min(scaleX, scaleY, 1);
      setScale(nextScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  function buildHighlights(square, chessInstance = game) {
    const moves = chessInstance.moves({ square, verbose: true });

    if (!moves.length) {
      setHighlightedSquares({});
      return;
    }

    const styles = {
      [square]: {
        boxShadow: "inset 0 0 0 3px #00eaff",
      },
    };

    moves.forEach((move) => {
      styles[move.to] = move.captured
        ? {
            background:
              "radial-gradient(circle, transparent 58%, rgba(0,234,255,0.9) 60%, transparent 66%)",
          }
        : {
            background:
              "radial-gradient(circle, rgba(0,234,255,0.45) 20%, transparent 22%)",
          };
    });

    setHighlightedSquares(styles);
  }

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
  }

  function onSquareClick(square) {
    const clickedPiece = game.get(square);

    if (selectedSquare === square) {
      clearSelection();
      return;
    }

    if (clickedPiece && clickedPiece.color === game.turn()) {
      setSelectedSquare(square);
      buildHighlights(square);
      return;
    }

    if (selectedSquare) {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (move) {
        setGame(gameCopy);
      }

      clearSelection();
      return;
    }

    clearSelection();
  }

  function onPieceDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    setGame(gameCopy);
    clearSelection();
    return true;
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: `${BOARD_SIZE}px`,
        }}
      >
        <section
          className="
            w-[834px]
            min-w-[834px]
            flex
            flex-col
          "
        >
          <div className="w-full flex items-center justify-between mb-[26px]">
            <div className="mb-[-12px]">
              <UserInfo
                name="Противник"
                level="??? lvl"
                avatar={DEFAULT_AVATAR}
              />
            </div>
            <Timer time="15:00" />
          </div>

          <div className="w-[834px] h-[834px] overflow-hidden rounded-[16px]">
            <Chessboard
              id="PawnRequiemBoard"
              position={game.fen()}
              boardWidth={BOARD_SIZE}
              customPieces={customPieces}
              customLightSquareStyle={{ backgroundColor: "#c8cfdb" }}
              customDarkSquareStyle={{ backgroundColor: "#aab3c8" }}
              customSquareStyles={highlightedSquares}
              onSquareClick={onSquareClick}
              onPieceDrop={onPieceDrop}
            />
          </div>

          <div className="w-full flex items-center justify-between mt-[18px]">
            <div className="mb-[-12px]">
              <UserInfo
                name="ChessMaster"
                level="14 lvl"
                avatar="/icons/avatar.jpg"
              />
            </div>
            <Timer time="15:00" />
          </div>
        </section>
      </div>
    </div>
  );
}