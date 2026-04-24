import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { getGameParams } from "../lib/gameParams";
import { useBoardEffectsController } from "../media/useBoardEffectsController.js";

const DEBUG_SHOW_EFFECT_ON_ANY_MOVE = true;
const PROMOTION_PIECE_ORDER = ["q", "r", "b", "n"];

let effectIndex = 1;

function normalizePromotionPiece(piece) {
  const normalized = String(piece || "").trim().toLowerCase();
  return /^[qrbn]$/.test(normalized) ? normalized : undefined;
}

function parseUciMove(move) {
  const normalized = String(move || "").trim().toLowerCase();
  const match = normalized.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: normalizePromotionPiece(match[3]),
  };
}

function loadGameFromFen(fen) {
  const nextGame = new Chess();

  if (!fen || fen === nextGame.fen()) {
    return nextGame;
  }

  try {
    nextGame.load(fen);
    return nextGame;
  } catch {
    return null;
  }
}

function cloneGameInstance(chessInstance) {
  if (!chessInstance) {
    return new Chess();
  }

  const history = chessInstance.history({ verbose: true });

  if (history.length > 0) {
    const gameCopy = new Chess();

    for (const historyMove of history) {
      if (!gameCopy.move(historyMove)) {
        return loadGameFromFen(chessInstance.fen());
      }
    }

    return gameCopy;
  }

  return loadGameFromFen(chessInstance.fen());
}

function buildGameFromServerState(state, currentGame = null) {
  const nextGame = new Chess();
  const moveList = Array.isArray(state?.moves) ? state.moves : [];

  if (moveList.length === 0) {
    if (state?.fen && state.fen !== nextGame.fen()) {
      return loadGameFromFen(state.fen);
    }
    return nextGame;
  }

  for (const moveEntry of moveList) {
    const parsedMove = parseUciMove(moveEntry?.move);
    if (!parsedMove || !nextGame.move(parsedMove)) {
      const parsedLastMove = parseUciMove(state?.last_move);
      if (currentGame && parsedLastMove) {
        const currentGameCopy = cloneGameInstance(currentGame);

        if (
          currentGameCopy?.move(parsedLastMove) &&
          (!state?.fen || currentGameCopy.fen() === state.fen)
        ) {
          return currentGameCopy;
        }
      }

      if (state?.fen) {
        return loadGameFromFen(state.fen);
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

function findKingSquare(chessInstance, color = chessInstance.turn()) {
  const board = chessInstance.board();

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    const rank = board[rankIndex];

    for (let fileIndex = 0; fileIndex < rank.length; fileIndex += 1) {
      const piece = rank[fileIndex];

      if (piece?.type !== "k" || piece.color !== color) {
        continue;
      }

      const file = String.fromCharCode(97 + fileIndex);
      const rankNumber = 8 - rankIndex;
      return `${file}${rankNumber}`;
    }
  }

  return "";
}

function mergeSquareStyles(baseStyles, overlayStyles) {
  const mergedStyles = { ...baseStyles };

  Object.entries(overlayStyles).forEach(([square, style]) => {
    mergedStyles[square] = {
      ...(baseStyles[square] || {}),
      ...style,
    };
  });

  return mergedStyles;
}

function buildKingThreatStyles(chessInstance) {
  if (!chessInstance?.inCheck()) {
    return {};
  }

  const kingSquare = findKingSquare(chessInstance);
  if (!kingSquare) {
    return {};
  }

  if (chessInstance.isCheckmate()) {
    return {
      [kingSquare]: {
        background:
          "linear-gradient(0deg, rgba(255, 56, 56, 0.72) 0%, rgba(164, 0, 0, 0.82) 100%)",
        boxShadow: "inset 0 0 0 3px rgba(255, 186, 186, 0.92)",
      },
    };
  }

  return {
    [kingSquare]: {
      animation: "king-check-flash 1s ease-in-out infinite",
      boxShadow: "inset 0 0 0 3px rgba(255, 200, 200, 0.95)",
    },
  };
}

export function useChessGame(options = {}) {
  const params = getGameParams();
  const playerColor = options.playerColor || params.playerColor || "w";
  const boardOrientation = playerColor === "b" ? "black" : "white";

  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [historyCursor, setHistoryCursor] = useState(0);
  const [promotionState, setPromotionState] = useState(null);

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
    setPromotionState(null);
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

  function getLegalMoves(square, chessInstance = gameRef.current) {
    return chessInstance.moves({ square, verbose: true });
  }

  function getMoveCandidates(from, to, chessInstance = gameRef.current) {
    return getLegalMoves(from, chessInstance).filter((move) => move.to === to);
  }

  function resolveMoveSelection(
    { from, to, promotion },
    chessInstance = gameRef.current
  ) {
    const moveCandidates = getMoveCandidates(from, to, chessInstance);

    if (!moveCandidates.length) {
      return { kind: "invalid" };
    }

    const promotionOptions = PROMOTION_PIECE_ORDER.filter((option) =>
      moveCandidates.some((move) => move.promotion === option)
    );

    if (!promotionOptions.length) {
      return { kind: "move" };
    }

    const normalizedPromotion = normalizePromotionPiece(promotion);

    if (normalizedPromotion && promotionOptions.includes(normalizedPromotion)) {
      return {
        kind: "move",
        promotion: normalizedPromotion,
      };
    }

    return {
      kind: "promotion",
      options: promotionOptions,
    };
  }

  function buildHighlights(square, chessInstance = gameRef.current) {
    const moves = getLegalMoves(square, chessInstance);

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
    return cloneGameInstance(gameRef.current);
  }

  function applyMove({ from, to, promotion }) {
    const previousHistoryLength = gameRef.current.history().length;
    const gameCopy = cloneGameFromHistory();
    const moveRequest = {
      from,
      to,
    };

    if (promotion) {
      moveRequest.promotion = promotion;
    }

    const move = gameCopy.move(moveRequest);

    if (!move) {
      return null;
    }

    setGame(gameCopy);
    syncHistoryCursor(gameCopy.history().length, previousHistoryLength);
    clearSelection();
    triggerMoveEffect(move);

    return move;
  }

  function sendValidatedMove(move, sendMove) {
    const payload = {
      from: move.from,
      to: move.to,
    };

    if (move.promotion) {
      payload.promotion = move.promotion;
    }

    sendMove?.(payload);
  }

  function completeMove(moveRequest, sendMove) {
    const move = applyMove(moveRequest);

    if (!move) {
      return false;
    }

    sendValidatedMove(move, sendMove);
    return true;
  }

  function openPromotionMenu({ from, to, piece, options }) {
    setSelectedSquare(from);
    buildHighlights(from);
    setPromotionState({
      from,
      to,
      color: piece?.color || playerColor,
      options,
    });
  }

  function cancelPromotion() {
    setPromotionState(null);
  }

  function onSquareClick(square, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;
    const clickedPiece = currentGame.get(square);

    if (promotionState) {
      return;
    }

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
      const moveSelection = resolveMoveSelection(
        {
          from: selectedSquare,
          to: square,
        },
        currentGame
      );

      if (moveSelection.kind === "promotion") {
        openPromotionMenu({
          from: selectedSquare,
          to: square,
          piece: currentGame.get(selectedSquare),
          options: moveSelection.options,
        });
        return;
      }

      if (moveSelection.kind !== "move") {
        return;
      }

      completeMove(
        {
          from: selectedSquare,
          to: square,
          promotion: moveSelection.promotion,
        },
        sendMove
      );
      return;
    }

    clearSelection();
  }

  function onPieceDrop(sourceSquare, targetSquare, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;
    const piece = currentGame.get(sourceSquare);

    if (promotionState) {
      return false;
    }

    if (isViewingHistory || !targetSquare) {
      return false;
    }

    if (!canControlPiece(piece, currentGame)) {
      return false;
    }

    const moveSelection = resolveMoveSelection(
      {
        from: sourceSquare,
        to: targetSquare,
      },
      currentGame
    );

    if (moveSelection.kind === "promotion") {
      openPromotionMenu({
        from: sourceSquare,
        to: targetSquare,
        piece,
        options: moveSelection.options,
      });
      return false;
    }

    if (moveSelection.kind !== "move") {
      return false;
    }

    return completeMove(
      {
        from: sourceSquare,
        to: targetSquare,
        promotion: moveSelection.promotion,
      },
      sendMove
    );
  }

  function onPromotionSelect(promotion, sendMove) {
    const currentPromotion = promotionState;
    const normalizedPromotion = normalizePromotionPiece(promotion);

    if (
      !currentPromotion ||
      !normalizedPromotion ||
      !currentPromotion.options.includes(normalizedPromotion)
    ) {
      return false;
    }

    return completeMove(
      {
        from: currentPromotion.from,
        to: currentPromotion.to,
        promotion: normalizedPromotion,
      },
      sendMove
    );
  }

  function isPieceDraggable({ sourceSquare }) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;

    if (promotionState || isViewingHistory) {
      return false;
    }

    return canControlPiece(currentGame.get(sourceSquare), currentGame);
  }

  function allowPieceDrag() {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== currentGame.history().length;

    if (promotionState || isViewingHistory) {
      return false;
    }

    return isPlayersTurn(currentGame);
  }

  function applyRemoteMove(move) {
    const appliedMove = applyMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    return Boolean(appliedMove);
  }

  function syncFromServerState(state) {
    const previousHistoryLength = gameRef.current.history().length;
    const nextGame = buildGameFromServerState(state, gameRef.current);
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
  const effectiveHighlightedSquares = mergeSquareStyles(
    highlightedSquares,
    buildKingThreatStyles(displayedGame)
  );

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

  function getCurrentFen() {
    return gameRef.current.fen();
  }

  return {
    game,
    displayedGame,
    activeHistoryPly,
    moveCount: game.history().length,
    highlightedSquares: effectiveHighlightedSquares,
    boardOrientation,
    activeEffects,
    promotionState,
    effect: triggerEffect,
    onSquareClick,
    onPieceDrop,
    onPromotionSelect,
    cancelPromotion,
    isPieceDraggable,
    canDragPieces: allowPieceDrag(),
    applyRemoteMove,
    syncFromServerState,
    getCurrentFen,
    viewPreviousMove,
    viewNextMove,
    jumpToLatestMove,
    canViewPrevious: activeHistoryPly > 0,
    canViewNext: activeHistoryPly < history.length,
    isViewingHistory: activeHistoryPly !== history.length,
  };
}
