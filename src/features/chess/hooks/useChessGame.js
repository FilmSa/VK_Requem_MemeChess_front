import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { analyzeMove } from "../lib/analyzerApi.js";
import { getGameParams } from "../lib/gameParams";
import {
  mapAnalyzerTagsToMemeTags,
  pickRandomMemeEffect,
} from "../media/memeEffects.js";
import { useBoardEffectsController } from "../media/useBoardEffectsController.js";
import {
  readStoredMemeMode,
  subscribeMemeModeChanges,
} from "../../../shared/lib/memeMode.js";

const DEBUG_SHOW_EFFECT_ON_ANY_MOVE = true;
const PROMOTION_PIECE_ORDER = ["q", "r", "b", "n"];
const RANDOM_MEME_FALLBACK_TAGS = [
  "ATTACK",
  "CHECK",
  "DANGER",
  "SMART",
  "DEFOLT",
];
const SEQUENCE_ANIMATION_DURATION_MS = 680;

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

function parseMoveSequence(move) {
  const parts = String(move || "")
    .split(",")
    .map((part) => parseUciMove(part))
    .filter(Boolean);

  return parts.length ? parts : null;
}

function listBoardSquares() {
  const squares = [];

  for (let rank = 1; rank <= 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      squares.push(`${String.fromCharCode(97 + file)}${rank}`);
    }
  }

  return squares;
}

const BOARD_SQUARES = listBoardSquares();

function isServerAuthoritativeMode(gameMode) {
  return gameMode === "fischer" || gameMode === "evolution";
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

function buildGameFromServerState(state, currentGame = null, options = {}) {
  const serverMode = String(options?.gameMode || state?.game_mode || "")
    .trim()
    .toLowerCase();
  if (isServerAuthoritativeMode(serverMode)) {
    return loadGameFromFen(state?.fen);
  }

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

function buildServerHistoryGame(historyCursor, serverMoves, initialFen, fallbackFen) {
  if (historyCursor <= 0) {
    return loadGameFromFen(initialFen) || loadGameFromFen(fallbackFen) || new Chess();
  }

  const moveEntry = serverMoves[historyCursor - 1];
  return (
    loadGameFromFen(moveEntry?.fen) ||
    loadGameFromFen(fallbackFen) ||
    loadGameFromFen(initialFen) ||
    new Chess()
  );
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

function buildRecentMoveSquareStyles(sequence) {
  if (!sequence?.length) {
    return {};
  }

  const styles = {};

  sequence.forEach((step, index) => {
    const isLast = index === sequence.length - 1;
    const targetSquare = step.to;

    styles[step.from] = {
      ...(styles[step.from] || {}),
      boxShadow:
        styles[step.from]?.boxShadow ||
        "inset 0 0 0 2px rgba(255, 214, 102, 0.9)",
    };

    styles[targetSquare] = {
      ...(styles[targetSquare] || {}),
      background: isLast
        ? "radial-gradient(circle, rgba(0, 234, 255, 0.34) 18%, transparent 22%)"
        : "radial-gradient(circle, rgba(255, 159, 67, 0.34) 18%, transparent 22%)",
      boxShadow: isLast
        ? "inset 0 0 0 2px rgba(0, 234, 255, 0.88)"
        : "inset 0 0 0 2px rgba(255, 159, 67, 0.88)",
    };
  });

  return styles;
}

function findSameSquareCastleOverlay(previousFen, nextFen, kingSquare) {
  const previousGame = loadGameFromFen(previousFen);
  const nextGame = loadGameFromFen(nextFen);
  if (!previousGame || !nextGame || !kingSquare) {
    return { arrows: [], styles: {} };
  }

  const kingPiece = previousGame.get(kingSquare);
  if (!kingPiece || kingPiece.type !== "k") {
    return { arrows: [], styles: {} };
  }

  const disappearedRooks = [];
  const appearedRooks = [];

  for (const square of BOARD_SQUARES) {
    const beforePiece = previousGame.get(square);
    const afterPiece = nextGame.get(square);

    const hadOwnRook =
      beforePiece?.type === "r" && beforePiece.color === kingPiece.color;
    const hasOwnRook =
      afterPiece?.type === "r" && afterPiece.color === kingPiece.color;

    if (hadOwnRook && !hasOwnRook) {
      disappearedRooks.push(square);
    }

    if (hasOwnRook && !hadOwnRook) {
      appearedRooks.push(square);
    }
  }

  if (disappearedRooks.length !== 1 || appearedRooks.length !== 1) {
    return {
      arrows: [],
      styles: {
        [kingSquare]: {
          boxShadow: "inset 0 0 0 3px rgba(255, 214, 102, 0.94)",
        },
      },
    };
  }

  const rookFrom = disappearedRooks[0];
  const rookTo = appearedRooks[0];

  return {
    arrows: [[rookFrom, rookTo, "rgba(255, 214, 102, 0.92)"]],
    styles: {
      [kingSquare]: {
        boxShadow: "inset 0 0 0 3px rgba(255, 214, 102, 0.94)",
      },
      [rookTo]: {
        background:
          "radial-gradient(circle, rgba(255, 214, 102, 0.38) 18%, transparent 22%)",
        boxShadow: "inset 0 0 0 2px rgba(255, 214, 102, 0.9)",
      },
    },
  };
}

function buildServerMoveOverlay({ serverMoves, initialFen, activeHistoryPly, historyLength }) {
  if (
    !Array.isArray(serverMoves) ||
    serverMoves.length === 0 ||
    activeHistoryPly !== historyLength
  ) {
    return { arrows: [], styles: {} };
  }

  const lastMoveEntry = serverMoves[serverMoves.length - 1];
  const sequence = parseMoveSequence(lastMoveEntry?.move);
  if (!sequence?.length) {
    return { arrows: [], styles: {} };
  }

  if (sequence.length > 1) {
    return {
      arrows: sequence.map((step, index) => [
        step.from,
        step.to,
        index === 0
          ? "rgba(255, 159, 67, 0.92)"
          : "rgba(0, 234, 255, 0.92)",
      ]),
      styles: buildRecentMoveSquareStyles(sequence),
    };
  }

  const [singleStep] = sequence;
  if (singleStep.from !== singleStep.to) {
    return {
      arrows: [[singleStep.from, singleStep.to, "rgba(255, 214, 102, 0.92)"]],
      styles: buildRecentMoveSquareStyles(sequence),
    };
  }

  return findSameSquareCastleOverlay(
    serverMoves.length > 1 ? serverMoves[serverMoves.length - 2]?.fen : initialFen,
    lastMoveEntry?.fen,
    singleStep.from
  );
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
      animation: "king-check-flash 0.45s ease-in-out 2",
      boxShadow: "inset 0 0 0 3px rgba(255, 200, 200, 0.95)",
    },
  };
}

function buildMoveMemeContext(move, chessAfterMove) {
  const candidateTags = [];
  let targetSquare = move.to;

  if (chessAfterMove.isCheckmate()) {
    candidateTags.push("CHECK", "DANGER");
    targetSquare = findKingSquare(chessAfterMove) || targetSquare;
  } else if (chessAfterMove.inCheck()) {
    candidateTags.push("CHECK", "DANGER");
    targetSquare = findKingSquare(chessAfterMove) || targetSquare;
  }

  if (move.promotion) {
    candidateTags.push("SMART");
  }

  if (move.captured) {
    candidateTags.push("ATTACK");

    if (["q", "r"].includes(move.captured)) {
      candidateTags.push("SMART");
    }
  }

  if (move.flags?.includes("k") || move.flags?.includes("q")) {
    candidateTags.push("SMART");
  }

  if (candidateTags.length === 0) {
    candidateTags.push("DEFOLT");
  }

  return {
    candidateTags,
    targetSquare,
  };
}

function buildMoveDto(move) {
  const moveDto = {
    from: String(move?.from || "").toLowerCase(),
    to: String(move?.to || "").toLowerCase(),
  };

  if (move?.promotion) {
    moveDto.promotion = String(move.promotion).toLowerCase();
  }

  return moveDto;
}

function buildMoveHistoryDtos(history) {
  return history.map((move) => buildMoveDto(move));
}

export function useChessGame(options = {}) {
  const params = getGameParams();
  const playerColor = options.playerColor || params.playerColor || "w";
  const allowBothColors = Boolean(options.allowBothColors);
  const gameMode = String(options.gameMode || "").trim().toLowerCase();
  const usesServerAuthoritativeRules =
    Boolean(options.forceServerAuthoritative) || isServerAuthoritativeMode(gameMode);
  const boardOrientation = playerColor === "b" ? "black" : "white";
  const interactionLocked = Boolean(options.interactionLocked);
  const serverLegalMoves = Array.isArray(options.serverLegalMoves)
    ? options.serverLegalMoves.filter((move) => typeof move === "string" && move.trim())
    : [];
  const serverMoves = Array.isArray(options.serverMoves) ? options.serverMoves : [];
  const initialFen =
    typeof options.initialFen === "string" && options.initialFen.trim()
      ? options.initialFen
      : new Chess().fen();
  const externalHighlightedSquares =
    options.extraHighlightedSquares &&
    typeof options.extraHighlightedSquares === "object"
      ? options.extraHighlightedSquares
      : {};

  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [historyCursor, setHistoryCursor] = useState(0);
  const [promotionState, setPromotionState] = useState(null);
  const [sequenceAnimationFen, setSequenceAnimationFen] = useState("");
  const [isMemeModeEnabled, setIsMemeModeEnabled] = useState(() =>
    typeof options.memeModeEnabled === "boolean"
      ? options.memeModeEnabled
      : readStoredMemeMode()
  );

  const { activeEffects, triggerEffect } = useBoardEffectsController();
  const gameRef = useRef(game);
  const historyCursorRef = useRef(historyCursor);
  const memeModeEnabledRef = useRef(isMemeModeEnabled);
  const serverMovesRef = useRef(serverMoves);
  const lastSyncedMoveCountRef = useRef(serverMoves.length);
  const sequenceAnimationTimerRef = useRef(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    historyCursorRef.current = historyCursor;
  }, [historyCursor]);

  useEffect(() => {
    memeModeEnabledRef.current = isMemeModeEnabled;
  }, [isMemeModeEnabled]);

  useEffect(() => {
    serverMovesRef.current = serverMoves;
  }, [serverMoves]);

  useEffect(() => {
    return () => {
      if (sequenceAnimationTimerRef.current) {
        window.clearTimeout(sequenceAnimationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof options.memeModeEnabled === "boolean") {
      setIsMemeModeEnabled(options.memeModeEnabled);
    }
  }, [options.memeModeEnabled]);

  useEffect(() => {
    return subscribeMemeModeChanges((enabled) => {
      setIsMemeModeEnabled(enabled);
    });
  }, []);

  useEffect(() => {
    if (interactionLocked) {
      clearSelection();
    }
  }, [interactionLocked]);

  function syncHistoryCursor(nextHistoryLength, previousHistoryLength) {
    setHistoryCursor((currentCursor) => {
      if (currentCursor >= previousHistoryLength) {
        return nextHistoryLength;
      }

      return Math.min(currentCursor, nextHistoryLength);
    });
  }

  function getCurrentHistoryLength() {
    if (usesServerAuthoritativeRules) {
      return serverMovesRef.current.length;
    }

    return gameRef.current.history().length;
  }

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
    setPromotionState(null);
  }

  function clearSequenceAnimation() {
    if (sequenceAnimationTimerRef.current) {
      window.clearTimeout(sequenceAnimationTimerRef.current);
      sequenceAnimationTimerRef.current = null;
    }
    setSequenceAnimationFen("");
  }

  function buildSequenceIntermediateFen(baseFen, sequence) {
    if (!sequence?.length || sequence.length < 2) {
      return "";
    }

    const previewGame = loadGameFromFen(baseFen);
    if (!previewGame?.move(sequence[0])) {
      return "";
    }

    return previewGame.fen();
  }

  async function triggerMoveEffect(move, chessAfterMove, historyBeforeMove = []) {
    if (!DEBUG_SHOW_EFFECT_ON_ANY_MOVE || !memeModeEnabledRef.current) {
      return;
    }

    const localContext = buildMoveMemeContext(
      move,
      chessAfterMove
    );
    let candidateTags = localContext.candidateTags;
    let shouldUseRandomFallback = false;
    let randomFallbackReason = "";

    try {
      const analysisResult = await analyzeMove({
        moves: buildMoveHistoryDtos(historyBeforeMove),
        move: buildMoveDto(move),
        depth: 3,
        timeoutMs: 1500,
      });

      if (!analysisResult) {
        shouldUseRandomFallback = true;
        randomFallbackReason = "empty-analysis-result";
      }

      const analyzerTags = mapAnalyzerTagsToMemeTags(
        analysisResult?.tags,
        analysisResult?.quality
      );

      if (analyzerTags.length > 0) {
        candidateTags = analyzerTags;
      }
    } catch {
      shouldUseRandomFallback = true;
      randomFallbackReason = "analysis-request-failed";
    }

    const memeEffect = pickRandomMemeEffect(
      shouldUseRandomFallback ? RANDOM_MEME_FALLBACK_TAGS : candidateTags
    );

    if (shouldUseRandomFallback && memeEffect) {
      console.info("[meme-fallback] Meme selected without backend analysis", {
        reason: randomFallbackReason || "unknown",
        move: buildMoveDto(move),
        selectedMemeId: memeEffect.id,
        selectedMemeTag: memeEffect.tag,
      });
    }

    triggerEffect(memeEffect || "1", {
      square: localContext.targetSquare,
      from: move.from,
      to: move.to,
      piece: move.piece,
    });
  }

  function isPlayersTurn(chessInstance = gameRef.current) {
    if (allowBothColors) {
      return true;
    }

    return chessInstance.turn() === playerColor;
  }

  function canControlPiece(piece, chessInstance = gameRef.current) {
    if (!piece) {
      return false;
    }
    if (!isPlayersTurn(chessInstance)) {
      return false;
    }
    return allowBothColors ? true : piece.color === playerColor;
  }

  function getLegalMoves(square, chessInstance = gameRef.current) {
    if (usesServerAuthoritativeRules) {
      return serverLegalMoves
        .map((move) => parseMoveSequence(move))
        .filter((sequence) => sequence?.[0]?.from === square)
        .map((sequence) => {
          const firstStep = sequence[0];
          const finalStep = sequence[sequence.length - 1];

          return {
            from: firstStep.from,
            to: finalStep.to,
            promotion: finalStep.promotion,
            raw: sequence
              .map((step) => `${step.from}${step.to}${step.promotion || ""}`)
              .join(","),
            isSequence: sequence.length > 1,
            isStationary: firstStep.from === finalStep.to,
          };
        });
    }

    return chessInstance.moves({ square, verbose: true });
  }

  function getMoveCandidates(from, to, chessInstance = gameRef.current) {
    return getLegalMoves(from, chessInstance).filter((move) => move.to === to);
  }

  function resolveMoveSelection(
    { from, to, promotion },
    chessInstance = gameRef.current
  ) {
    if (usesServerAuthoritativeRules) {
      const moveCandidates = getMoveCandidates(from, to, chessInstance);

      if (!moveCandidates.length) {
        return { kind: "invalid" };
      }

      const promotionOptions = PROMOTION_PIECE_ORDER.filter((option) =>
        moveCandidates.some((move) => move.promotion === option)
      );

      if (!promotionOptions.length) {
        const preferredCandidate = [...moveCandidates].sort((left, right) => {
          if (Boolean(left.isSequence) === Boolean(right.isSequence)) {
            return 0;
          }
          return left.isSequence ? 1 : -1;
        })[0];

        return {
          kind: "move",
          raw: preferredCandidate.raw,
        };
      }

      const normalizedPromotion = normalizePromotionPiece(promotion);

      if (normalizedPromotion && promotionOptions.includes(normalizedPromotion)) {
        const matchedCandidate = moveCandidates.find(
          (move) => move.promotion === normalizedPromotion
        );

        return {
          kind: "move",
          promotion: normalizedPromotion,
          raw: matchedCandidate?.raw,
        };
      }

      return {
        kind: "promotion",
        options: promotionOptions,
      };
    }

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
      const nextStyle =
        !usesServerAuthoritativeRules && move.captured
          ? {
              background:
                "radial-gradient(circle, transparent 58%, rgba(0,234,255,0.9) 60%, transparent 66%)",
            }
          : {
              background: move.isStationary
                ? "radial-gradient(circle, rgba(255, 214, 102, 0.34) 18%, transparent 22%)"
                : "radial-gradient(circle, rgba(0,234,255,0.45) 20%, transparent 22%)",
              boxShadow:
                move.isSequence || move.isStationary
                  ? "inset 0 0 0 2px rgba(255, 159, 67, 0.88)"
                  : undefined,
            };

      styles[move.to] = {
        ...(styles[move.to] || {}),
        ...nextStyle,
      };
    });

    setHighlightedSquares(styles);
  }

  function cloneGameFromHistory() {
    if (usesServerAuthoritativeRules) {
      return loadGameFromFen(gameRef.current.fen()) || new Chess();
    }

    return cloneGameInstance(gameRef.current);
  }

  function applyMove({ from, to, promotion }) {
    if (usesServerAuthoritativeRules) {
      return null;
    }

    const historyBeforeMove = gameRef.current.history({ verbose: true });
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
    void triggerMoveEffect(move, gameCopy, historyBeforeMove);

    return move;
  }

  function sendValidatedMove(move, sendMove) {
    if (usesServerAuthoritativeRules) {
      if (move?.raw) {
        return sendMove?.(move.raw);
      }

      const payload = {
        from: move.from,
        to: move.to,
      };

      if (move.promotion) {
        payload.promotion = move.promotion;
      }

      return sendMove?.(payload);
    }

    const payload = {
      from: move.from,
      to: move.to,
    };

    if (move.promotion) {
      payload.promotion = move.promotion;
    }

    return sendMove?.(payload);
  }

  function completeMove(moveRequest, sendMove) {
    if (usesServerAuthoritativeRules) {
      const sent = Boolean(
        sendValidatedMove(
          {
            from: moveRequest.from,
            to: moveRequest.to,
            promotion: moveRequest.promotion,
            raw: moveRequest.raw,
          },
          sendMove
        )
      );

      if (sent) {
        clearSelection();
      }

      return sent;
    }

    const move = applyMove(moveRequest);

    if (!move) {
      return false;
    }

    sendValidatedMove(move, sendMove);
    return true;
  }

  function openPromotionMenu({ from, to, piece, options, raw }) {
    setSelectedSquare(from);
    buildHighlights(from);
    setPromotionState({
      from,
      to,
      color: piece?.color || playerColor,
      options,
      raw,
    });
  }

  function cancelPromotion() {
    setPromotionState(null);
  }

  function onSquareClick(square, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();
    const clickedPiece = currentGame.get(square);

    if (promotionState || interactionLocked) {
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
      const moveSelection = resolveMoveSelection(
        {
          from: selectedSquare,
          to: square,
        },
        currentGame
      );

      if (moveSelection.kind === "move") {
        completeMove(
          {
            from: selectedSquare,
            to: square,
            promotion: moveSelection.promotion,
            raw: moveSelection.raw,
          },
          sendMove
        );
        return;
      }

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
          raw: moveSelection.raw,
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
          raw: moveSelection.raw,
        },
        sendMove
      );
      return;
    }

    clearSelection();
  }

  function onPieceDrop(sourceSquare, targetSquare, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();
    const piece = currentGame.get(sourceSquare);

    if (promotionState || interactionLocked) {
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
        raw: moveSelection.raw,
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
        raw: moveSelection.raw,
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
        raw: currentPromotion.raw,
      },
      sendMove
    );
  }

  function isPieceDraggable({ sourceSquare }) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();

    if (promotionState || isViewingHistory || interactionLocked) {
      return false;
    }

    return canControlPiece(currentGame.get(sourceSquare), currentGame);
  }

  function allowPieceDrag() {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();

    if (promotionState || isViewingHistory || interactionLocked) {
      return false;
    }

    return isPlayersTurn(currentGame);
  }

  function applyRemoteMove(move) {
    if (usesServerAuthoritativeRules) {
      return false;
    }

    const appliedMove = applyMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    return Boolean(appliedMove);
  }

  function syncFromServerState(state) {
    const previousHistoryLength = lastSyncedMoveCountRef.current;
    const nextGame = buildGameFromServerState(state, gameRef.current, {
      gameMode,
    });
    if (!nextGame) {
      return false;
    }

    const nextHistoryLength = Array.isArray(state?.moves)
      ? state.moves.length
      : nextGame.history().length;
    const isLatestView = historyCursorRef.current >= previousHistoryLength;
    const lastMoveEntry =
      nextHistoryLength > 0 && Array.isArray(state?.moves)
        ? state.moves[nextHistoryLength - 1]
        : null;
    const lastSequence = parseMoveSequence(lastMoveEntry?.move);

    lastSyncedMoveCountRef.current = nextHistoryLength;
    setGame(nextGame);
    syncHistoryCursor(nextHistoryLength, previousHistoryLength);

    if (
      usesServerAuthoritativeRules &&
      isLatestView &&
      nextHistoryLength === previousHistoryLength + 1 &&
      lastSequence?.length > 1
    ) {
      const previousFen =
        nextHistoryLength > 1
          ? state.moves[nextHistoryLength - 2]?.fen
          : state?.initial_fen || initialFen;
      const intermediateFen = buildSequenceIntermediateFen(previousFen, lastSequence);

      if (intermediateFen && intermediateFen !== nextGame.fen()) {
        clearSequenceAnimation();
        setSequenceAnimationFen(intermediateFen);
        sequenceAnimationTimerRef.current = window.setTimeout(() => {
          sequenceAnimationTimerRef.current = null;
          setSequenceAnimationFen("");
        }, SEQUENCE_ANIMATION_DURATION_MS);
      } else {
        clearSequenceAnimation();
      }
    } else {
      clearSequenceAnimation();
    }

    clearSelection();
    return true;
  }

  const verboseHistory = usesServerAuthoritativeRules
    ? []
    : game.history({ verbose: true });
  const history = usesServerAuthoritativeRules
    ? serverMoves.map((move) => move?.move || "")
    : verboseHistory.map((move) =>
        `${move.from}${move.to}${move.promotion || ""}`.toLowerCase()
      );
  const activeHistoryPly = Math.min(historyCursor, history.length);
  const baseDisplayedGame = usesServerAuthoritativeRules
    ? buildServerHistoryGame(historyCursor, serverMoves, initialFen, game.fen())
    : buildGameToPly(verboseHistory, historyCursor);
  const displayedGame =
    usesServerAuthoritativeRules &&
    sequenceAnimationFen &&
    activeHistoryPly === history.length
      ? loadGameFromFen(sequenceAnimationFen) || baseDisplayedGame
      : baseDisplayedGame;
  const recentMoveOverlay = usesServerAuthoritativeRules
    ? buildServerMoveOverlay({
        serverMoves,
        initialFen,
        activeHistoryPly,
        historyLength: history.length,
      })
    : { arrows: [], styles: {} };
  const effectiveHighlightedSquares = mergeSquareStyles(
    mergeSquareStyles(
      mergeSquareStyles(highlightedSquares, recentMoveOverlay.styles),
      buildKingThreatStyles(displayedGame)
    ),
    externalHighlightedSquares
  );

  function viewPreviousMove() {
    clearSequenceAnimation();
    setHistoryCursor((currentCursor) => Math.max(currentCursor - 1, 0));
    clearSelection();
  }

  function viewNextMove() {
    clearSequenceAnimation();
    setHistoryCursor((currentCursor) => Math.min(currentCursor + 1, history.length));
    clearSelection();
  }

  function jumpToLatestMove() {
    clearSequenceAnimation();
    setHistoryCursor(history.length);
    clearSelection();
  }

  function getCurrentFen() {
    return gameRef.current.fen();
  }

  return {
    game,
    history,
    displayedGame,
    activeHistoryPly,
    moveCount: history.length,
    highlightedSquares: effectiveHighlightedSquares,
    customArrows: recentMoveOverlay.arrows,
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
