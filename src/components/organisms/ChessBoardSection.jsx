import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import UserInfo from "../molecules/UserInfo";
import { createGameSocket, getDebugToken } from "../../shared/ws/gameSocket.js";

const BOARD_SIZE = 834;
const DEFAULT_AVATAR = "/images/default-avatar.png";

const API_BASE_URL = "http://localhost:8080";

const searchParams = new URLSearchParams(window.location.search);

const GAME_ID = searchParams.get("game") || "room-1";
const USER_ID = searchParams.get("user") || "1";

const PLAYER_COLOR = USER_ID === "1" ? "w" : "b";
const BOARD_ORIENTATION = PLAYER_COLOR === "w" ? "white" : "black";

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
        w-[150px]
        h-[44px]
        rounded-[20px_0px]
        bg-[#070d34]
        shadow-[0_4px_10px_rgba(0,0,0,0.35)]
        flex
        items-center
        justify-center
        text-[22px]
        leading-none
        font-medium
        text-white
      "
      style={{ fontFamily: '"Unbounded", sans-serif' }}
    >
      {time}
    </div>
  );
}

export default function ChessBoardSection() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [scale, setScale] = useState(1);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const gameRef = useRef(game);
  const socketRef = useRef(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

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

      setScale(Math.min(scaleX, scaleY, 1));
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const token = await getDebugToken(API_BASE_URL, USER_ID);
        if (cancelled) return;

        const client = createGameSocket({
          baseHttpUrl: API_BASE_URL,
          token,
          gameId: GAME_ID,
          userId: USER_ID,

          onOpen: () => {
            setIsSocketConnected(true);
          },

          onClose: () => {
            setIsSocketConnected(false);
          },

          onJoined: (payload) => {
            console.log("WS joined:", payload);
          },

          onMove: ({ isOwnMessage, move }) => {
            if (isOwnMessage) return;

            const gameCopy = new Chess(gameRef.current.fen());
            const appliedMove = gameCopy.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion || "q",
            });

            if (!appliedMove) {
              console.warn("Received invalid move from WS:", move);
              return;
            }

            setGame(gameCopy);
            clearSelection();
          },

          onError: (error) => {
            console.error("WS error:", error);
          },
        });

        socketRef.current = client;
      } catch (error) {
        console.error("Failed to connect WS:", error);
        setIsSocketConnected(false);
      }
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
  }

  function isPlayersTurn(chessInstance = gameRef.current) {
  return chessInstance.turn() === PLAYER_COLOR;
}

function canControlPiece(piece, chessInstance = gameRef.current) {
  if (!piece) return false;
  if (!isPlayersTurn(chessInstance)) return false;
  return piece.color === PLAYER_COLOR;
}

  function buildHighlights(square, chessInstance = gameRef.current) {
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

  function applyLocalMove({ from, to, promotion = "q", shouldSend = true }) {
    const gameCopy = new Chess(gameRef.current.fen());

    const move = gameCopy.move({
      from,
      to,
      promotion,
    });

    if (!move) return false;

    setGame(gameCopy);
    clearSelection();

    if (shouldSend) {
      socketRef.current?.sendMove({ from, to, promotion });
    }

    return true;
  }

  function onSquareClick(square) {
  const currentGame = gameRef.current;
  const clickedPiece = currentGame.get(square);

  if (!isPlayersTurn(currentGame)) {
    clearSelection();
    return;
  }

  if (selectedSquare === square) {
    clearSelection();
    return;
  }

  if (clickedPiece && canControlPiece(clickedPiece, currentGame)) {
    setSelectedSquare(square);
    buildHighlights(square, currentGame);
    return;
  }

  if (selectedSquare) {
    applyLocalMove({
      from: selectedSquare,
      to: square,
      promotion: "q",
      shouldSend: true,
    });
    return;
  }

  clearSelection();
}

  function onPieceDrop(sourceSquare, targetSquare) {
    const currentGame = gameRef.current;
    const piece = currentGame.get(sourceSquare);

    if (!canControlPiece(piece, currentGame)) {
      return false;
    }

    return applyLocalMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
      shouldSend: true,
    });
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          width: `${Math.floor(BOARD_SIZE * scale)}px`,
        }}
      >
        <section
          className="flex flex-col"
          style={{ width: Math.floor(BOARD_SIZE * scale) }}
        >
          <div className="w-full flex items-center justify-between mb-[26px]">
            <div className="mb-[-12px]">
              <UserInfo
                name="Противник"
                level="??? lvl"
                avatar={DEFAULT_AVATAR}
              />
            </div>

            <div className="flex items-center gap-3">
              <Timer time="15:00" />
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[16px]"
            style={{
              width: Math.floor(BOARD_SIZE * scale),
              height: Math.floor(BOARD_SIZE * scale),
            }}
          >
            <Chessboard
              id="PawnRequiemBoard"
              position={game.fen()}
              boardOrientation={BOARD_ORIENTATION}
              boardWidth={Math.floor(BOARD_SIZE * scale)}
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