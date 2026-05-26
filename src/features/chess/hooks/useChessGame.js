import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { BOARD_MOVE_ANIMATION_DURATION_MS } from "../lib/boardConfig.js";
import { getGameParams } from "../lib/gameParams";
import {
  analyzeMoveForMeme,
  rebuildOrdinaryMoveCountFromServerMoves,
} from "../media/moveMemeClassifier.js";
import {
  createMemeRotationState,
  getMemeEffectById,
  pickDeterministicMemeEffect,
  pickNextMemeEffect,
} from "../media/memeEffects.js";
import { preloadAllMemeAssets } from "../media/memePreload.js";
import { useBoardEffectsController } from "../media/useBoardEffectsController.js";
import { MEME_CATEGORIES } from "../media/memeConfig.js";
import {
  readStoredMemeMode,
  subscribeMemeModeChanges,
} from "../../../shared/lib/memeMode.js";

const DEBUG_SHOW_EFFECT_ON_ANY_MOVE = true;
const PROMOTION_PIECE_ORDER = ["q", "r", "b", "n"];
const SEQUENCE_ANIMATION_DURATION_MS = 680;
const IMPORTANT_PIECE_TYPES = new Set(["n", "b", "r", "q"]);
const PIECE_VALUES = Object.freeze({
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
});

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

function getOppositeColor(color) {
  return color === "b" ? "w" : "b";
}

function isImportantPieceType(pieceType) {
  return IMPORTANT_PIECE_TYPES.has(String(pieceType || "").trim().toLowerCase());
}

function getPieceValue(pieceType) {
  return PIECE_VALUES[String(pieceType || "").trim().toLowerCase()] || 0;
}

function isServerAuthoritativeMode(gameMode) {
  return gameMode === "fischer" || gameMode === "evolution";
}

function shouldPreferServerMoveMemeMetadata(gameMode) {
  return gameMode === "meme";
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

function getNestedValue(source, path) {
  return path.reduce(
    (current, key) =>
      current && typeof current === "object" && key in current ? current[key] : undefined,
    source
  );
}

function normalizeAnalyzerClassification(value) {
  return String(value || "").trim().toLowerCase();
}

function isAnalyzerMistakeClassification(moveEntry) {
  const candidatePaths = [
    ["classification"],
    ["move_classification"],
    ["mistake"],
    ["analysis", "classification"],
    ["analysis", "move_classification"],
    ["analysis", "mistake"],
    ["analyzer", "classification"],
    ["analyzer", "move_classification"],
    ["analyzer", "mistake"],
    ["analysis_result", "classification"],
    ["analysis_result", "move_classification"],
    ["analysis_result", "mistake"],
  ];

  return candidatePaths.some((path) => {
    const value = getNestedValue(moveEntry, path);

    if (typeof value === "boolean") {
      return value;
    }

    const normalized = normalizeAnalyzerClassification(value);
    return normalized === "mistake";
  });
}

function collectCapturedPieces(previousGame, nextGame, movedPieceColor) {
  if (!previousGame || !nextGame || !movedPieceColor) {
    return [];
  }

  const enemyColor = getOppositeColor(movedPieceColor);
  const capturedPieces = [];

  for (const square of BOARD_SQUARES) {
    const beforePiece = previousGame.get(square);
    const afterPiece = nextGame.get(square);

    if (
      beforePiece?.color === enemyColor &&
      (!afterPiece || afterPiece.color !== enemyColor || afterPiece.type !== beforePiece.type)
    ) {
      capturedPieces.push({
        ...beforePiece,
        square,
      });
    }
  }

  return capturedPieces;
}

function resolveMoveSquares(moveEntry, move, sequence) {
  const firstStep = Array.isArray(sequence) && sequence.length > 0 ? sequence[0] : null;
  const lastStep =
    Array.isArray(sequence) && sequence.length > 0 ? sequence[sequence.length - 1] : null;

  return {
    fromSquare: move?.from || firstStep?.from || "",
    toSquare: move?.to || lastStep?.to || "",
  };
}

function shouldAllowSacrificeMeme({
  moveEntry,
  previousGame,
  nextGame,
  move = null,
  sequence = null,
}) {
  if (!isAnalyzerMistakeClassification(moveEntry) || !previousGame || !nextGame) {
    return false;
  }

  const { fromSquare, toSquare } = resolveMoveSquares(moveEntry, move, sequence);
  if (!fromSquare || !toSquare) {
    return false;
  }

  const movedPieceBefore = previousGame.get(fromSquare);
  const movedPieceAfter = nextGame.get(toSquare);
  const movedPieceType = movedPieceAfter?.type || movedPieceBefore?.type || "";
  const movedPieceColor = movedPieceAfter?.color || movedPieceBefore?.color || "";

  if (!isImportantPieceType(movedPieceType) || !movedPieceColor) {
    return false;
  }

  if (nextGame.isCheck() || nextGame.isCheckmate()) {
    return false;
  }

  const opponentColor = getOppositeColor(movedPieceColor);
  const attackers = nextGame.attackers(toSquare, opponentColor) || [];
  if (attackers.length === 0) {
    return false;
  }

  const defenders = nextGame.attackers(toSquare, movedPieceColor) || [];
  const movedPieceValue = getPieceValue(movedPieceType);
  const capturedMaterialValue = collectCapturedPieces(
    previousGame,
    nextGame,
    movedPieceColor
  ).reduce((sum, piece) => sum + getPieceValue(piece?.type), 0);
  const weakestAttackerValue = attackers.reduce((minValue, attackerSquare) => {
    const attackerPiece = nextGame.get(attackerSquare);
    const attackerValue = getPieceValue(attackerPiece?.type);

    if (!attackerValue) {
      return minValue;
    }

    return Math.min(minValue, attackerValue);
  }, Number.POSITIVE_INFINITY);

  const isLikelyHanging =
    defenders.length === 0 ||
    attackers.length > defenders.length ||
    weakestAttackerValue <= movedPieceValue;
  const lacksCompensation = capturedMaterialValue < movedPieceValue;

  return isLikelyHanging && lacksCompensation;
}

function resolveServerMemeCategory({
  moveEntry,
  serverMemeCategory = "",
  derivedCategory = "",
  preferServerMetadata = false,
  previousGame = null,
  nextGame = null,
  move = null,
  sequence = null,
}) {
  const preferredCategory = preferServerMetadata
    ? serverMemeCategory || derivedCategory
    : derivedCategory || serverMemeCategory;

  if (
    preferredCategory === MEME_CATEGORIES.SACRIFICE &&
    !shouldAllowSacrificeMeme({
      moveEntry,
      previousGame,
      nextGame,
      move,
      sequence,
    })
  ) {
    return "";
  }

  return preferredCategory;
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

function buildResolvedServerHistoryEntries({
  serverMoves,
  initialFen,
  gameMode,
  gameId,
}) {
  if (!Array.isArray(serverMoves) || serverMoves.length === 0) {
    return [];
  }

  const preferServerMetadata = shouldPreferServerMoveMemeMetadata(gameMode);
  const initialGame = loadGameFromFen(initialFen);
  const resolvedEntries = [];
  let previousFen = initialFen;
  let ordinaryMoveCount = 0;

  serverMoves.forEach((moveEntry, index) => {
    const moveValue = String(moveEntry?.move || "").trim().toLowerCase();
    const previousGame = loadGameFromFen(previousFen);
    const nextGame = loadGameFromFen(moveEntry?.fen);
    const derivedAnalysis =
      previousGame && nextGame
        ? analyzeMoveForMeme({
            previousGame,
            nextGame,
            sequence: parseMoveSequence(moveValue),
            initialFen,
            initialGame,
            ordinaryMoveCount,
          })
        : null;

    if (derivedAnalysis) {
      ordinaryMoveCount = derivedAnalysis.nextOrdinaryMoveCount;
    }

    const serverMemeId = String(
      moveEntry?.meme_id || moveEntry?.memeId || ""
    ).trim();
    const serverMemeCategory =
      String(moveEntry?.meme_category || moveEntry?.memeCategory || "").trim() ||
      String(getMemeEffectById(serverMemeId)?.category || "").trim();
    const derivedCategory = String(derivedAnalysis?.category || "").trim();
    const resolvedCategory = resolveServerMemeCategory({
      moveEntry,
      serverMemeCategory,
      derivedCategory,
      preferServerMetadata,
      previousGame,
      nextGame,
      sequence: parseMoveSequence(moveValue),
    });

    let resolvedMemeId = preferServerMetadata && resolvedCategory ? serverMemeId : "";
    if (!resolvedMemeId && resolvedCategory) {
      const resolvedMeme = pickDeterministicMemeEffect(resolvedCategory, {
        gameId,
        moveKey: moveValue,
        moveNumber: index + 1,
        previousEntries: resolvedEntries,
      });
      resolvedMemeId = resolvedMeme?.id || "";
    }

    resolvedEntries.push({
      move: moveValue,
      memeId: resolvedMemeId,
      memeCategory: resolvedCategory,
    });
    previousFen = moveEntry?.fen || previousFen;
  });

  return resolvedEntries;
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

function buildMoveEffectKey(historyLength, move) {
  const normalizedHistoryLength = Number.isFinite(historyLength)
    ? Math.max(0, Math.trunc(historyLength))
    : 0;
  const normalizedMove = buildMoveDto(move);

  if (!normalizedMove.from || !normalizedMove.to) {
    return "";
  }

  return `${normalizedHistoryLength}:${normalizedMove.from}${normalizedMove.to}${
    normalizedMove.promotion || ""
  }`;
}

function buildServerMoveEffectKey(historyLength, moveEntry, fallbackMove = null) {
  const moveEffectKey = buildMoveEffectKey(historyLength, fallbackMove);
  if (moveEffectKey) {
    return moveEffectKey;
  }

  const rawMove = String(moveEntry?.move || "").trim().toLowerCase();
  if (!rawMove) {
    return "";
  }

  const normalizedHistoryLength = Number.isFinite(historyLength)
    ? Math.max(0, Math.trunc(historyLength))
    : 0;
  return `${normalizedHistoryLength}:${rawMove}`;
}

function buildRawMoveString(moveRequest) {
  const source = String(moveRequest?.from || "").trim().toLowerCase();
  const target = String(moveRequest?.to || "").trim().toLowerCase();
  const promotion = normalizePromotionPiece(moveRequest?.promotion);

  if (!/^[a-h][1-8]$/.test(source) || !/^[a-h][1-8]$/.test(target)) {
    return "";
  }

  return `${source}${target}${promotion || ""}`;
}

function findPreviewCastleRookMove(chessInstance, color, from, to) {
  if (!chessInstance || !color || !from || !to || from[1] !== to[1]) {
    return null;
  }

  const rank = from[1];
  const targetFile = to[0];
  const sourceFileCode = from.charCodeAt(0);
  const rookTargetSquare = targetFile === "g" ? `f${rank}` : targetFile === "c" ? `d${rank}` : "";

  if (!rookTargetSquare) {
    return null;
  }

  const rookSquares = BOARD_SQUARES.filter((square) => {
    if (square === from || square[1] !== rank) {
      return false;
    }

    const piece = chessInstance.get(square);
    return piece?.type === "r" && piece.color === color;
  }).sort((left, right) => left.charCodeAt(0) - right.charCodeAt(0));

  const rookSourceSquare =
    targetFile === "g"
      ? rookSquares.find((square) => square.charCodeAt(0) > sourceFileCode)
      : [...rookSquares].reverse().find((square) => square.charCodeAt(0) < sourceFileCode);

  if (!rookSourceSquare) {
    return null;
  }

  return {
    from: rookSourceSquare,
    to: rookTargetSquare,
  };
}

function buildAuthoritativePreviewFen(baseFen, moveRequest) {
  const rawMove = String(moveRequest?.raw || "").trim().toLowerCase() || buildRawMoveString(moveRequest);
  const sequence = parseMoveSequence(rawMove);
  const previewGame = loadGameFromFen(baseFen);

  if (!previewGame || !sequence?.length) {
    return "";
  }

  for (const step of sequence) {
    if (!step?.from || !step?.to || step.from === step.to) {
      return "";
    }

    const movingPiece = previewGame.get(step.from);
    if (!movingPiece) {
      return "";
    }

    const castleRookMove =
      sequence.length === 1 && movingPiece.type === "k"
        ? findPreviewCastleRookMove(previewGame, movingPiece.color, step.from, step.to)
        : null;

    previewGame.remove(step.to);
    previewGame.remove(step.from);

    if (
      !previewGame.put(
        { type: step.promotion || movingPiece.type, color: movingPiece.color },
        step.to
      )
    ) {
      return "";
    }

    if (castleRookMove && castleRookMove.from !== castleRookMove.to) {
      const rookPiece = previewGame.get(castleRookMove.from);
      if (!rookPiece || rookPiece.type !== "r" || rookPiece.color !== movingPiece.color) {
        return "";
      }

      previewGame.remove(castleRookMove.to);
      previewGame.remove(castleRookMove.from);
      if (!previewGame.put({ type: "r", color: movingPiece.color }, castleRookMove.to)) {
        return "";
      }
    }
  }

  const [placement, turn = "w", , , , fullmove = "1"] = previewGame.fen().split(/\s+/);
  const nextTurn = turn === "w" ? "b" : "w";
  const nextFullmove =
    turn === "b"
      ? String(Math.max(1, Number.parseInt(fullmove, 10) + 1 || 1))
      : fullmove;

  return `${placement} ${nextTurn} - - 0 ${nextFullmove}`;
}

export function useChessGame(options = {}) {
  const params = getGameParams();
  const playerColor = options.playerColor || params.playerColor || "w";
  const allowBothColors = Boolean(options.allowBothColors);
  const gameMode = String(options.gameMode || "").trim().toLowerCase();
  const syncKey = String(options.syncKey || "").trim();
  const usesServerAuthoritativeRules =
    Boolean(options.forceServerAuthoritative) || isServerAuthoritativeMode(gameMode);
  const isSpecialAuthoritativeMode = isServerAuthoritativeMode(gameMode);
  const preferServerMoveMemeMetadata = shouldPreferServerMoveMemeMetadata(gameMode);
  const preferStateMoveEffects = Boolean(options.preferStateMoveEffects);
  const shouldPreloadMemeAssets = Boolean(options.preloadMemeAssets);
  const boardOrientation = playerColor === "b" ? "black" : "white";
  const interactionLocked = Boolean(options.interactionLocked);
  const currentUserId = String(options.currentUserId || "").trim();
  const isBotGame = Boolean(options.isBotGame);
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
  const [authoritativePreviewFen, setAuthoritativePreviewFen] = useState("");
  const [visibleServerMoves, setVisibleServerMoves] = useState(() => serverMoves);
  const [visibleServerLegalMoves, setVisibleServerLegalMoves] = useState(
    () => serverLegalMoves
  );
  const [isMemeModeEnabled, setIsMemeModeEnabled] = useState(() =>
    typeof options.memeModeEnabled === "boolean"
      ? options.memeModeEnabled
      : readStoredMemeMode()
  );
  const [isBoardAnimationLocked, setIsBoardAnimationLocked] = useState(false);
  const isGameOver =
    typeof game?.isGameOver === "function" ? game.isGameOver() : false;
  const boardInteractionLocked =
    interactionLocked ||
    isGameOver ||
    isBoardAnimationLocked ||
    (usesServerAuthoritativeRules &&
      (Boolean(authoritativePreviewFen) ||
        serverMoves.length !== visibleServerMoves.length));

  const { activeEffects, effectLayerVolume, triggerEffect, removeEffect } =
    useBoardEffectsController();
  const gameRef = useRef(game);
  const historyCursorRef = useRef(historyCursor);
  const promotionStateRef = useRef(promotionState);
  const memeModeEnabledRef = useRef(isMemeModeEnabled);
  const serverMovesRef = useRef(visibleServerMoves);
  const lastSyncedMoveCountRef = useRef(visibleServerMoves.length);
  const sequenceAnimationTimerRef = useRef(null);
  const pendingServerSyncTimerRef = useRef(null);
  const pendingServerSyncPayloadRef = useRef(null);
  const lastTriggeredMoveEffectKeyRef = useRef("");
  const boardAnimationLockTimerRef = useRef(null);
  const outgoingAnimationNotBeforeRef = useRef(0);
  const memeRotationStateRef = useRef(createMemeRotationState());
  const ordinaryMoveCountRef = useRef(
    rebuildOrdinaryMoveCountFromServerMoves({
      serverMoves,
      initialFen,
    })
  );

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    historyCursorRef.current = historyCursor;
  }, [historyCursor]);

  useEffect(() => {
    promotionStateRef.current = promotionState;
  }, [promotionState]);

  useEffect(() => {
    memeModeEnabledRef.current = isMemeModeEnabled;
  }, [isMemeModeEnabled]);

  useEffect(() => {
    serverMovesRef.current = visibleServerMoves;
  }, [visibleServerMoves]);

  useEffect(() => {
    if (!shouldPreloadMemeAssets) {
      return;
    }

    void preloadAllMemeAssets();
  }, [shouldPreloadMemeAssets]);

  useEffect(() => {
    return () => {
      if (sequenceAnimationTimerRef.current) {
        window.clearTimeout(sequenceAnimationTimerRef.current);
      }
      if (pendingServerSyncTimerRef.current) {
        window.clearTimeout(pendingServerSyncTimerRef.current);
      }
      if (boardAnimationLockTimerRef.current) {
        window.clearTimeout(boardAnimationLockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    pendingServerSyncPayloadRef.current = null;
    lastTriggeredMoveEffectKeyRef.current = "";
    lastSyncedMoveCountRef.current = serverMoves.length;
    memeRotationStateRef.current = createMemeRotationState();
    ordinaryMoveCountRef.current = rebuildOrdinaryMoveCountFromServerMoves({
      serverMoves,
      initialFen,
    });
    clearBoardAnimationLock();
    setAuthoritativePreviewFen("");
    setVisibleServerMoves(serverMoves);
    setVisibleServerLegalMoves(serverLegalMoves);
    if (pendingServerSyncTimerRef.current) {
      window.clearTimeout(pendingServerSyncTimerRef.current);
      pendingServerSyncTimerRef.current = null;
    }
    clearSequenceAnimation();
    clearSelection();

    const resetGame = buildGameFromServerState(
      {
        moves: serverMoves,
        fen: serverMoves[serverMoves.length - 1]?.fen || initialFen,
        initial_fen: initialFen,
        game_mode: gameMode,
      },
      null,
      { gameMode }
    );

    setGame(resetGame || loadGameFromFen(initialFen) || new Chess());
    setHistoryCursor(serverMoves.length);
  }, [gameMode, initialFen, syncKey, usesServerAuthoritativeRules, isBotGame]);

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
    if (boardInteractionLocked) {
      clearSelection();
    }
  }, [boardInteractionLocked]);

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

  function clearBoardAnimationLock() {
    outgoingAnimationNotBeforeRef.current = 0;
    if (boardAnimationLockTimerRef.current) {
      window.clearTimeout(boardAnimationLockTimerRef.current);
      boardAnimationLockTimerRef.current = null;
    }
    setIsBoardAnimationLocked(false);
  }

  function armBoardAnimationLock(durationMs = BOARD_MOVE_ANIMATION_DURATION_MS, options = {}) {
    const safeDurationMs = Math.max(0, Number(durationMs) || 0);
    const markOutgoing = Boolean(options.markOutgoing);
    const deadline = Date.now() + safeDurationMs;

    if (markOutgoing) {
      outgoingAnimationNotBeforeRef.current = deadline;
    }

    if (boardAnimationLockTimerRef.current) {
      window.clearTimeout(boardAnimationLockTimerRef.current);
      boardAnimationLockTimerRef.current = null;
    }

    if (!safeDurationMs) {
      setIsBoardAnimationLocked(false);
      return;
    }

    setIsBoardAnimationLocked(true);
    boardAnimationLockTimerRef.current = window.setTimeout(() => {
      boardAnimationLockTimerRef.current = null;
      if (outgoingAnimationNotBeforeRef.current <= Date.now()) {
        outgoingAnimationNotBeforeRef.current = 0;
      }
      setIsBoardAnimationLocked(false);
    }, safeDurationMs);
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

  function triggerResolvedMoveEffect({
    move = null,
    chessAfterMove = null,
    previousGame = null,
    sequence = null,
  }) {
    if (!chessAfterMove || !previousGame) {
      return false;
    }

    const analysis = analyzeMoveForMeme({
      previousGame,
      nextGame: chessAfterMove,
      move,
      sequence,
      initialFen,
      ordinaryMoveCount: ordinaryMoveCountRef.current,
    });
    const lastSequenceStep =
      Array.isArray(sequence) && sequence.length > 0
        ? sequence[sequence.length - 1]
        : null;
    ordinaryMoveCountRef.current = analysis.nextOrdinaryMoveCount;

    if (!DEBUG_SHOW_EFFECT_ON_ANY_MOVE || !memeModeEnabledRef.current) {
      return false;
    }

    if (!analysis.category || !analysis.targetSquare) {
      return false;
    }

    const memeEffect = pickNextMemeEffect(
      analysis.category,
      memeRotationStateRef.current
    );

    if (!memeEffect) {
      return false;
    }

    const instanceId = triggerEffect(memeEffect, {
      square: analysis.targetSquare,
      from: move?.from || sequence?.[0]?.from || null,
      to: move?.to || lastSequenceStep?.to || analysis.targetSquare,
      piece:
        move?.piece ||
        chessAfterMove.get(analysis.targetSquare)?.type ||
        previousGame.get(move?.from || sequence?.[0]?.from || "")?.type ||
        null,
    });

    return Boolean(instanceId);
  }

  function triggerMemeEffectById(memeId, effectContext = {}) {
    if (!memeModeEnabledRef.current) {
      return false;
    }

    const memeEffect = getMemeEffectById(memeId);
    const targetSquare =
      effectContext.square ||
      effectContext.to ||
      effectContext.from ||
      "";

    if (!memeEffect || !targetSquare) {
      return false;
    }

    const instanceId = triggerEffect(memeEffect, {
      square: targetSquare,
      from: effectContext.from || null,
      to: effectContext.to || targetSquare,
      piece: effectContext.piece || null,
    });

    return Boolean(instanceId);
  }

  function triggerClientMoveEffect({
    move,
    chessAfterMove,
    previousGame = null,
    sequence = null,
  }) {
    if (!chessAfterMove) {
      return false;
    }

    return triggerResolvedMoveEffect({
      move,
      chessAfterMove,
      previousGame,
      sequence,
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
      return visibleServerLegalMoves
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

  function applyMove({ from, to, promotion }, options = {}) {
    if (usesServerAuthoritativeRules) {
      return null;
    }

    const previousHistoryLength = gameRef.current.history().length;
    const gameCopy = cloneGameFromHistory();
    const previousGame = loadGameFromFen(gameCopy.fen()) || cloneGameFromHistory();
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
    armBoardAnimationLock(BOARD_MOVE_ANIMATION_DURATION_MS, {
      markOutgoing: options.markOutgoing !== false,
    });
    if (!preferStateMoveEffects) {
      lastTriggeredMoveEffectKeyRef.current = buildMoveEffectKey(
        gameCopy.history().length,
        move
      );
      triggerResolvedMoveEffect({
        move,
        chessAfterMove: gameCopy,
        previousGame,
      });
    }

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

  function previewAuthoritativeMoveEffect(moveRequest) {
    const previousFen = gameRef.current.fen();
    const previewFen = buildAuthoritativePreviewFen(previousFen, moveRequest);
    if (preferStateMoveEffects) {
      return previewFen;
    }

    const rawMove = moveRequest?.raw || buildRawMoveString(moveRequest);
    const previewSequence = parseMoveSequence(
      String(rawMove).trim().toLowerCase()
    );
    const previousGame = loadGameFromFen(previousFen);
    const previewGame = loadGameFromFen(previewFen);

    if (!previousGame || !previewGame || !previewSequence?.length) {
      return previewFen;
    }

    const effectMoveKey = buildServerMoveEffectKey(
      lastSyncedMoveCountRef.current + 1,
      { move: rawMove },
      null
    );
    const didTrigger = triggerResolvedMoveEffect({
      chessAfterMove: previewGame,
      previousGame,
      sequence: previewSequence,
    });
    if (didTrigger) {
      lastTriggeredMoveEffectKeyRef.current = effectMoveKey;
    }

    return previewFen;
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
        setAuthoritativePreviewFen(previewAuthoritativeMoveEffect(moveRequest));
        armBoardAnimationLock(BOARD_MOVE_ANIMATION_DURATION_MS, {
          markOutgoing: true,
        });
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

  function onPieceDragBegin(_pieceCode, sourceSquare) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();
    const piece = currentGame.get(sourceSquare);

    if (promotionStateRef.current || boardInteractionLocked || isViewingHistory) {
      return;
    }

    if (!canControlPiece(piece, currentGame)) {
      return;
    }

    setSelectedSquare(sourceSquare);
    buildHighlights(sourceSquare, currentGame);
  }

  function onPieceDragEnd() {
    if (promotionStateRef.current) {
      return;
    }

    clearSelection();
  }

  function onSquareClick(square, sendMove) {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();
    const clickedPiece = currentGame.get(square);

    if (promotionState || boardInteractionLocked) {
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

    if (promotionState || boardInteractionLocked) {
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

    const moveAccepted = completeMove(
      {
        from: sourceSquare,
        to: targetSquare,
        promotion: moveSelection.promotion,
        raw: moveSelection.raw,
      },
      sendMove
    );

    if (moveAccepted) {
      // react-chessboard skips move animation for accepted manual drops.
      // Keep every outgoing drag move on the external-position path instead.
      return false;
    }

    return false;
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

    if (promotionState || isViewingHistory || boardInteractionLocked) {
      return false;
    }

    return canControlPiece(currentGame.get(sourceSquare), currentGame);
  }

  function allowPieceDrag() {
    const currentGame = gameRef.current;
    const isViewingHistory = historyCursorRef.current !== getCurrentHistoryLength();

    if (promotionState || isViewingHistory || boardInteractionLocked) {
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
    }, { markOutgoing: false });

    return Boolean(appliedMove);
  }

  function syncFromServerState(state) {
    const previousHistoryLength = lastSyncedMoveCountRef.current;
    const nextServerMoves = Array.isArray(state?.moves) ? state.moves : [];
    const nextServerLegalMoves = Array.isArray(state?.legal_moves)
      ? state.legal_moves.filter((move) => typeof move === "string" && move.trim())
      : [];
    const nextGame = buildGameFromServerState(state, gameRef.current, {
      gameMode,
    });
    if (!nextGame) {
      return false;
    }

    const nextHistoryLength = nextServerMoves.length || nextGame.history().length;
    const appendedMoveCount = Math.max(0, nextHistoryLength - previousHistoryLength);
    const isLatestView = historyCursorRef.current >= previousHistoryLength;
    const lastMoveEntry = nextHistoryLength > 0 ? nextServerMoves[nextHistoryLength - 1] : null;
    const lastSequence = parseMoveSequence(lastMoveEntry?.move);
    const previousFen =
      nextHistoryLength > 1
        ? nextServerMoves[nextHistoryLength - 2]?.fen
        : state?.initial_fen || initialFen;
    const previousGame = loadGameFromFen(previousFen);
    const historyAfterMove = nextGame.history({ verbose: true });
    const latestMoveFromHistory =
      historyAfterMove.length >= nextHistoryLength
        ? historyAfterMove[nextHistoryLength - 1]
        : historyAfterMove[historyAfterMove.length - 1] || null;
    const effectMoveKey =
      appendedMoveCount > 0
        ? buildServerMoveEffectKey(
            nextHistoryLength,
            lastMoveEntry,
            latestMoveFromHistory
          )
        : "";
    const ordinaryMoveCountBeforeLatest = rebuildOrdinaryMoveCountFromServerMoves({
      serverMoves: nextServerMoves.slice(0, -1),
      initialFen: state?.initial_fen || initialFen,
    });
    const ordinaryMoveCountAfterSync = rebuildOrdinaryMoveCountFromServerMoves({
      serverMoves: nextServerMoves,
      initialFen: state?.initial_fen || initialFen,
    });
    const latestMovePreviewAnalysis =
      previousGame && nextGame && (latestMoveFromHistory || lastSequence?.length)
        ? analyzeMoveForMeme({
            previousGame,
            nextGame,
            move: latestMoveFromHistory,
            sequence: lastSequence,
            initialFen: state?.initial_fen || initialFen,
            ordinaryMoveCount: ordinaryMoveCountBeforeLatest,
          })
        : null;
    const previousResolvedHistoryEntries = buildResolvedServerHistoryEntries({
      serverMoves: nextServerMoves.slice(0, -1),
      initialFen: state?.initial_fen || initialFen,
      gameMode,
      gameId: syncKey,
    });
    const latestMoveMemeId = String(
      lastMoveEntry?.meme_id || lastMoveEntry?.memeId || ""
    ).trim();
    const latestMoveMemeCategory =
      String(lastMoveEntry?.meme_category || lastMoveEntry?.memeCategory || "").trim() ||
      String(getMemeEffectById(latestMoveMemeId)?.category || "").trim();
    const latestResolvedMemeCategory = resolveServerMemeCategory({
      moveEntry: lastMoveEntry,
      serverMemeCategory: latestMoveMemeCategory,
      derivedCategory: String(latestMovePreviewAnalysis?.category || "").trim(),
      preferServerMetadata: preferServerMoveMemeMetadata,
      previousGame,
      nextGame,
      move: latestMoveFromHistory,
      sequence: lastSequence,
    });
    const latestEffectSquare =
      latestMovePreviewAnalysis?.targetSquare ||
      latestMoveFromHistory?.to ||
      lastSequence?.[lastSequence.length - 1]?.to ||
      "";
    const latestEffectFromSquare =
      latestMoveFromHistory?.from || lastSequence?.[0]?.from || "";
    const latestEffectContext = {
      square: latestEffectSquare,
      from: latestEffectFromSquare || null,
      to:
        latestMoveFromHistory?.to ||
        lastSequence?.[lastSequence.length - 1]?.to ||
        latestEffectSquare ||
        null,
      piece:
        latestMoveFromHistory?.piece ||
        (latestEffectSquare ? nextGame.get(latestEffectSquare)?.type : null) ||
        (latestEffectFromSquare ? previousGame?.get(latestEffectFromSquare)?.type : null) ||
        null,
    };
    const pendingPayload = pendingServerSyncPayloadRef.current;

    if (
      pendingServerSyncTimerRef.current &&
      pendingPayload?.effectMoveKey === effectMoveKey &&
      pendingPayload?.historyLength === nextHistoryLength
    ) {
      return true;
    }

    if (pendingServerSyncTimerRef.current) {
      window.clearTimeout(pendingServerSyncTimerRef.current);
      pendingServerSyncTimerRef.current = null;
    }
    const shouldTriggerEffect =
      appendedMoveCount > 0 &&
      Boolean(effectMoveKey) &&
      effectMoveKey !== lastTriggeredMoveEffectKeyRef.current;

    const commitServerState = ({ animateBoard = false } = {}) => {
      setAuthoritativePreviewFen("");
      lastSyncedMoveCountRef.current = nextHistoryLength;
      setVisibleServerMoves(nextServerMoves);
      setVisibleServerLegalMoves(nextServerLegalMoves);
      setGame(nextGame);
      syncHistoryCursor(nextHistoryLength, previousHistoryLength);

      let boardAnimationDurationMs = animateBoard
        ? BOARD_MOVE_ANIMATION_DURATION_MS
        : 0;

      if (
        usesServerAuthoritativeRules &&
        isLatestView &&
        nextHistoryLength === previousHistoryLength + 1 &&
        lastSequence?.length > 1
      ) {
        const intermediateFen = buildSequenceIntermediateFen(previousFen, lastSequence);

        if (intermediateFen && intermediateFen !== nextGame.fen()) {
          clearSequenceAnimation();
          setSequenceAnimationFen(intermediateFen);
          boardAnimationDurationMs = Math.max(
            boardAnimationDurationMs,
            SEQUENCE_ANIMATION_DURATION_MS + BOARD_MOVE_ANIMATION_DURATION_MS
          );
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

      if (shouldTriggerEffect) {
        let didTriggerServerEffect = false;

        if (
          preferServerMoveMemeMetadata &&
          latestMoveMemeId &&
          latestResolvedMemeCategory
        ) {
          didTriggerServerEffect = triggerMemeEffectById(
            latestMoveMemeId,
            latestEffectContext
          );
        }

        if (!didTriggerServerEffect) {
          ordinaryMoveCountRef.current = ordinaryMoveCountBeforeLatest;
          const fallbackMeme = latestResolvedMemeCategory
            ? pickDeterministicMemeEffect(latestResolvedMemeCategory, {
              gameId: syncKey,
              moveKey: String(lastMoveEntry?.move || "").trim().toLowerCase(),
              moveNumber: nextHistoryLength,
              previousEntries: previousResolvedHistoryEntries,
            })
            : null;

          if (fallbackMeme?.id) {
            didTriggerServerEffect = triggerMemeEffectById(
              fallbackMeme.id,
              latestEffectContext
            );
          }

          if (!didTriggerServerEffect) {
            didTriggerServerEffect = triggerClientMoveEffect({
              move: latestMoveFromHistory,
              chessAfterMove: nextGame,
              previousGame,
              sequence: lastSequence,
            });
          }
        }

        if (didTriggerServerEffect) {
          lastTriggeredMoveEffectKeyRef.current = effectMoveKey;
        }
      }

      ordinaryMoveCountRef.current = ordinaryMoveCountAfterSync;

      if (boardAnimationDurationMs > 0) {
        armBoardAnimationLock(boardAnimationDurationMs);
      }
    };

    const lastMoveUserId = String(
      lastMoveEntry?.user_id || lastMoveEntry?.userId || ""
    ).trim();
    const stateMovedByOpponent =
      Boolean(currentUserId) &&
      nextHistoryLength > previousHistoryLength &&
      ((lastMoveUserId && lastMoveUserId !== currentUserId) ||
        String(state?.current_turn_user_id || state?.currentTurnUserId || "").trim() ===
          currentUserId);

    const remainingOutgoingAnimationMs =
      stateMovedByOpponent && isLatestView
        ? Math.max(0, outgoingAnimationNotBeforeRef.current - Date.now())
        : 0;
    const remainingDelayMs = remainingOutgoingAnimationMs;

    if (stateMovedByOpponent && isLatestView && remainingDelayMs > 0) {
      pendingServerSyncPayloadRef.current = {
        effectMoveKey,
        historyLength: nextHistoryLength,
      };
      pendingServerSyncTimerRef.current = window.setTimeout(() => {
        pendingServerSyncTimerRef.current = null;
        pendingServerSyncPayloadRef.current = null;
        commitServerState({
          animateBoard: true,
        });
      }, remainingDelayMs);
      return true;
    }

    pendingServerSyncPayloadRef.current = null;
    commitServerState({
      animateBoard: stateMovedByOpponent && isLatestView,
    });
    return true;
  }

  const verboseHistory = usesServerAuthoritativeRules
    ? []
    : game.history({ verbose: true });
  const history = usesServerAuthoritativeRules
    ? visibleServerMoves.map((move) => move?.move || "")
    : verboseHistory.map((move) =>
        `${move.from}${move.to}${move.promotion || ""}`.toLowerCase()
      );
  const canResolveHistoryEntriesFromState =
    visibleServerMoves.length > 0 && visibleServerMoves.length === history.length;
  const historyEntries = usesServerAuthoritativeRules ||
    (!preferServerMoveMemeMetadata && canResolveHistoryEntriesFromState)
    ? buildResolvedServerHistoryEntries({
        serverMoves: visibleServerMoves,
        initialFen,
        gameMode,
        gameId: syncKey,
      })
    : history.map((moveValue, index) => {
        const serverMoveEntry = visibleServerMoves[index];
        const previousFen = index > 0
          ? visibleServerMoves[index - 1]?.fen
          : initialFen;
        const previousGame = loadGameFromFen(previousFen);
        const nextGame = loadGameFromFen(serverMoveEntry?.fen);
        const sequence = parseMoveSequence(moveValue);
        const serverMemeCategory = String(
          serverMoveEntry?.meme_category || serverMoveEntry?.memeCategory || ""
        ).trim() ||
          String(
            getMemeEffectById(
              String(serverMoveEntry?.meme_id || serverMoveEntry?.memeId || "").trim()
            )?.category || ""
          ).trim();
        const memeCategory = resolveServerMemeCategory({
          moveEntry: serverMoveEntry,
          serverMemeCategory,
          derivedCategory: "",
          preferServerMetadata: true,
          previousGame,
          nextGame,
          sequence,
        });

        return {
          move: moveValue,
          memeId: memeCategory
            ? String(serverMoveEntry?.meme_id || serverMoveEntry?.memeId || "").trim()
            : "",
          memeCategory,
        };
      });
  const activeHistoryPly = Math.min(historyCursor, history.length);
  const activeHistoryEntry =
    activeHistoryPly > 0 ? historyEntries[activeHistoryPly - 1] || null : null;
  const baseDisplayedGame = usesServerAuthoritativeRules
    ? buildServerHistoryGame(historyCursor, visibleServerMoves, initialFen, game.fen())
    : buildGameToPly(verboseHistory, historyCursor);
  const previewDisplayedGame =
    usesServerAuthoritativeRules &&
    authoritativePreviewFen &&
    activeHistoryPly === history.length
      ? loadGameFromFen(authoritativePreviewFen)
      : null;
  const displayedGame =
    usesServerAuthoritativeRules &&
    sequenceAnimationFen &&
    activeHistoryPly === history.length
      ? loadGameFromFen(sequenceAnimationFen) || previewDisplayedGame || baseDisplayedGame
      : previewDisplayedGame || baseDisplayedGame;
  const recentMoveOverlay = { arrows: [], styles: {} };
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
    historyEntries,
    displayedGame,
    activeHistoryEntry,
    activeHistoryPly,
    moveCount: history.length,
    syncedMoveCount: visibleServerMoves.length,
    highlightedSquares: effectiveHighlightedSquares,
    customArrows: recentMoveOverlay.arrows,
    boardOrientation,
    activeEffects,
    effectLayerVolume,
    removeEffect,
    promotionState,
    effect: triggerEffect,
    onPieceDragBegin,
    onPieceDragEnd,
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
