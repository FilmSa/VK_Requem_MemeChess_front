import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { getGameParams } from "../lib/gameParams";
import { useBoardEffects } from "./useBoardEffects";

const DEBUG_SHOW_EFFECT_ON_ANY_MOVE = true;

let effectIndex = 1;

function parseUciMove(move) {
  const normalized = String(move || "").trim().toLowerCase();
  const match = normalized.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: match[3] || "q",
  };
}

function buildGameFromServerState(state) {
  const nextGame = new Chess();
  const moveList = Array.isArray(state?.moves) ? state.moves : [];

  if (moveList.length === 0) {
    if (state?.fen && state.fen !== nextGame.fen()) {
      nextGame.load(state.fen);
    }
    return nextGame;
  }

  for (const moveEntry of moveList) {
    const parsedMove = parseUciMove(moveEntry?.move);
    if (!parsedMove || !nextGame.move(parsedMove)) {
      if (state?.fen) {
        const fallbackGame = new Chess();
        fallbackGame.load(state.fen);
        return fallbackGame;
      }
      return null;
    }
  }

  return nextGame;
}

export function useChessGame(options = {}) {
  const params = getGameParams();
  const playerColor = options.playerColor || params.playerColor || "w";
  const boardOrientation = playerColor === "b" ? "black" : "white";

  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});

  const { activeEffects, effect } = useBoardEffects();
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
  }

  function triggerMoveEffect(move) {
    if (!DEBUG_SHOW_EFFECT_ON_ANY_MOVE) {
      return;
    }

    effect(String(effectIndex), {
      square: move.to,
      from: move.from,
      to: move.to,
      piece: move.piece,
    });

    effectIndex = (effectIndex % 5) + 1;
  }

  function isPlayersTurn(chessInstance = gameRef.current) {
    return chessInstance.turn() === playerColor;
  }

  function canControlPiece(piece, chessInstance = gameRef.current) {
    if (!piece) {
      return false;
    }
    if (!isPlayersTurn(chessInstance)) {
      return false;
    }
    return piece.color === playerColor;
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

  function cloneGameFromHistory() {
    const gameCopy = new Chess();
    const history = gameRef.current.history({ verbose: true });

    history.forEach((historyMove) => {
      gameCopy.move(historyMove);
    });

    return gameCopy;
  }

  function applyMove({ from, to, promotion = "q" }) {
    const gameCopy = cloneGameFromHistory();
    const move = gameCopy.move({
      from,
      to,
      promotion,
    });

    if (!move) {
      return null;
    }

    setGame(gameCopy);
    clearSelection();
    triggerMoveEffect(move);

    return move;
  }

  function onSquareClick(square, sendMove) {
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
      const move = applyMove({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (move) {
        sendMove?.({
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        });
      }

      return;
    }

    clearSelection();
  }

  function onPieceDrop(sourceSquare, targetSquare, sendMove) {
    const currentGame = gameRef.current;
    const piece = currentGame.get(sourceSquare);

    if (!canControlPiece(piece, currentGame)) {
      return false;
    }

    const move = applyMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move) {
      sendMove?.({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q",
      });
      return true;
    }

    return false;
  }

  function applyRemoteMove(move) {
    const appliedMove = applyMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q",
    });

    return Boolean(appliedMove);
  }

  function syncFromServerState(state) {
    const nextGame = buildGameFromServerState(state);
    if (!nextGame) {
      return false;
    }

    setGame(nextGame);
    clearSelection();
    return true;
  }

  return {
    game,
    moveCount: game.history().length,
    highlightedSquares,
    boardOrientation,
    activeEffects,
    effect,
    onSquareClick,
    onPieceDrop,
    applyRemoteMove,
    syncFromServerState,
  };
}
