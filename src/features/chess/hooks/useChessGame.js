import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { getGameParams } from "../lib/gameParams";
import { useBoardEffectsController } from "../media/useBoardEffectsController.js";

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

function buildGameToPly(history, plyCount) {
  const nextGame = new Chess();
  const safePlyCount = Math.max(0, Math.min(plyCount, history.length));

  for (let index = 0; index < safePlyCount; index += 1) {
    nextGame.move(history[index]);
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
  const [historyCursor, setHistoryCursor] = useState(0);

  const { activeEffects, triggerEffect } = useBoardEffectsController();
  const gameRef = useRef(game);
  const historyCursorRef = useRef(historyCursor);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    historyCursorRef.current = historyCursor;
  }, [historyCursor]);

  function syncHistoryCursor(nextHistoryLength, previousHistoryLength) {
    setHistoryCursor((currentCursor) => {
      if (currentCursor >= previousHistoryLength) {
        return nextHistoryLength;
      }

      return Math.min(currentCursor, nextHistoryLength);
    });
  }

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
  }

  function triggerMoveEffect(move) {
    if (!DEBUG_SHOW_EFFECT_ON_ANY_MOVE) {
      return;
    }

    triggerEffect(String(effectIndex), {
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
    const previousHistoryLength = gameRef.current.history().length;
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
    syncHistoryCursor(gameCopy.history().length, previousHistoryLength);
    clearSelection();
    triggerMoveEffect(move);

    return move;
  }

  function onSquareClick(square, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;
    const clickedPiece = currentGame.get(square);

    if (isViewingHistory) {
      clearSelection();
      return;
    }

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
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;
    const piece = currentGame.get(sourceSquare);

    if (isViewingHistory) {
      return false;
    }

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
    const previousHistoryLength = gameRef.current.history().length;
    const nextGame = buildGameFromServerState(state);
    if (!nextGame) {
      return false;
    }

    setGame(nextGame);
    syncHistoryCursor(nextGame.history().length, previousHistoryLength);
    clearSelection();
    return true;
  }

  const history = game.history({ verbose: true });
  const displayedGame = buildGameToPly(history, historyCursor);
  const activeHistoryPly = Math.min(historyCursor, history.length);

  function viewPreviousMove() {
    setHistoryCursor((currentCursor) => Math.max(currentCursor - 1, 0));
    clearSelection();
  }

  function viewNextMove() {
    setHistoryCursor((currentCursor) => Math.min(currentCursor + 1, history.length));
    clearSelection();
  }

  function jumpToLatestMove() {
    setHistoryCursor(history.length);
    clearSelection();
  }

  return {
    game,
    displayedGame,
    activeHistoryPly,
    moveCount: game.history().length,
    highlightedSquares,
    boardOrientation,
    activeEffects,
    effect: triggerEffect,
    onSquareClick,
    onPieceDrop,
    applyRemoteMove,
    syncFromServerState,
    viewPreviousMove,
    viewNextMove,
    jumpToLatestMove,
    canViewPrevious: activeHistoryPly > 0,
    canViewNext: activeHistoryPly < history.length,
    isViewingHistory: activeHistoryPly !== history.length,
  };
}
