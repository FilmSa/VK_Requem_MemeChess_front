import { Chess } from "chess.js";
import { MEME_CATEGORIES } from "./memeConfig.js";

const IMPORTANT_PIECE_TYPES = new Set(["n", "b", "r", "q"]);
const PIECE_VALUES = Object.freeze({
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
});
const SLIDING_DIRECTIONS = {
  b: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
  r: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  q: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
};

function listBoardSquares() {
  const squares = [];

  for (let rank = 1; rank <= 8; rank += 1) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      squares.push(`${String.fromCharCode(97 + fileIndex)}${rank}`);
    }
  }

  return squares;
}

const BOARD_SQUARES = listBoardSquares();

function getOppositeColor(color) {
  return color === "b" ? "w" : "b";
}

function isImportantPieceType(pieceType) {
  return IMPORTANT_PIECE_TYPES.has(String(pieceType || "").toLowerCase());
}

function getPieceValue(pieceType) {
  return PIECE_VALUES[String(pieceType || "").toLowerCase()] || 0;
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

function parseMoveStep(move) {
  const normalized = String(move || "").trim().toLowerCase();
  const match = normalized.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: match[3] || "",
  };
}

function parseMoveSequence(move) {
  const steps = String(move || "")
    .split(",")
    .map((step) => parseMoveStep(step))
    .filter(Boolean);

  return steps.length > 0 ? steps : null;
}

function resolveActorInfo({ move = null, sequence = null, previousGame = null, nextGame = null }) {
  const normalizedSequence = Array.isArray(sequence) ? sequence.filter(Boolean) : [];
  const firstStep = normalizedSequence[0] || null;
  const lastStep = normalizedSequence[normalizedSequence.length - 1] || null;
  const fromSquare = move?.from || firstStep?.from || "";
  const targetSquare = move?.to || lastStep?.to || fromSquare || "";
  const previousPiece = fromSquare ? previousGame?.get(fromSquare) : null;
  const nextPiece = targetSquare ? nextGame?.get(targetSquare) : null;

  return {
    fromSquare,
    targetSquare,
    movedPieceType:
      nextPiece?.type || move?.piece || move?.promotion || previousPiece?.type || "",
    movedPieceColor: nextPiece?.color || previousPiece?.color || "",
  };
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

function findKingSquare(chessInstance, color) {
  if (!chessInstance || !color) {
    return "";
  }

  for (const square of BOARD_SQUARES) {
    const piece = chessInstance.get(square);
    if (piece?.type === "k" && piece.color === color) {
      return square;
    }
  }

  return "";
}

function scanLine(startSquare, [fileDelta, rankDelta]) {
  const squares = [];
  let fileCode = startSquare.charCodeAt(0);
  let rank = Number(startSquare[1]);

  while (true) {
    fileCode += fileDelta;
    rank += rankDelta;

    if (fileCode < 97 || fileCode > 104 || rank < 1 || rank > 8) {
      return squares;
    }

    squares.push(`${String.fromCharCode(fileCode)}${rank}`);
  }
}

function createsPin(nextGame, actorSquare, actorColor, movedPieceType) {
  const directions = SLIDING_DIRECTIONS[String(movedPieceType || "").toLowerCase()];
  if (!nextGame || !actorSquare || !actorColor || !directions) {
    return false;
  }

  for (const direction of directions) {
    let firstEnemyPiece = null;

    for (const square of scanLine(actorSquare, direction)) {
      const piece = nextGame.get(square);

      if (!piece) {
        continue;
      }

      if (piece.color === actorColor) {
        break;
      }

      if (!firstEnemyPiece) {
        if (!isImportantPieceType(piece.type)) {
          break;
        }

        firstEnemyPiece = piece;
        continue;
      }

      if (piece.type === "k" || isImportantPieceType(piece.type)) {
        return true;
      }

      break;
    }
  }

  return false;
}

function collectAttackedPieces(nextGame, actorSquare, actorColor) {
  if (!nextGame || !actorSquare || !actorColor) {
    return [];
  }

  const enemyColor = getOppositeColor(actorColor);
  const attackedPieces = [];

  for (const square of BOARD_SQUARES) {
    const piece = nextGame.get(square);

    if (!piece || piece.color !== enemyColor) {
      continue;
    }

    const attackers = nextGame.attackers(square, actorColor);
    if (Array.isArray(attackers) && attackers.includes(actorSquare)) {
      attackedPieces.push({
        ...piece,
        square,
      });
    }
  }

  return attackedPieces;
}

function collectAttackedImportantPieces(attackedPieces = []) {
  return attackedPieces.filter((piece) => isImportantPieceType(piece.type));
}

function createsAttack(attackedPieces = []) {
  return attackedPieces.length >= 1;
}

function createsFork(attackedImportantPieces = []) {
  return attackedImportantPieces.length >= 2;
}

function movedFromInitialSquare(initialGame, previousGame, actorInfo) {
  if (!initialGame || !previousGame || !actorInfo?.fromSquare) {
    return false;
  }

  const initialPiece = initialGame.get(actorInfo.fromSquare);
  const previousPiece = previousGame.get(actorInfo.fromSquare);

  return (
    initialPiece?.type === actorInfo.movedPieceType &&
    initialPiece.color === actorInfo.movedPieceColor &&
    previousPiece?.type === actorInfo.movedPieceType &&
    previousPiece.color === actorInfo.movedPieceColor
  );
}

function createsBadSacrifice({
  previousGame,
  nextGame,
  actorInfo,
  capturedPieces = [],
}) {
  const movedPieceSquare = actorInfo?.targetSquare || actorInfo?.fromSquare || "";
  const movedPieceType = actorInfo?.movedPieceType || "";
  const movedPieceColor = actorInfo?.movedPieceColor || "";

  if (
    !previousGame ||
    !nextGame ||
    !movedPieceSquare ||
    !movedPieceColor ||
    !isImportantPieceType(movedPieceType)
  ) {
    return false;
  }

  if (nextGame.isCheckmate() || nextGame.inCheck()) {
    return false;
  }

  const enemyColor = getOppositeColor(movedPieceColor);
  const attackers = nextGame.attackers(movedPieceSquare, enemyColor) || [];

  if (!Array.isArray(attackers) || attackers.length === 0) {
    return false;
  }

  const defenders = nextGame.attackers(movedPieceSquare, movedPieceColor) || [];
  const movedPieceValue = getPieceValue(movedPieceType);
  const capturedMaterialValue = capturedPieces.reduce(
    (sum, piece) => sum + getPieceValue(piece?.type),
    0
  );
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

export function analyzeMoveForMeme({
  previousGame,
  nextGame,
  move = null,
  sequence = null,
  initialFen = "",
  initialGame = null,
  ordinaryMoveCount = 0,
}) {
  if (!previousGame || !nextGame) {
    return {
      category: null,
      targetSquare: "",
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const actorInfo = resolveActorInfo({
    move,
    sequence,
    previousGame,
    nextGame,
  });
  const movedPieceSquare = actorInfo.targetSquare || actorInfo.fromSquare;
  const movedPieceColor = actorInfo.movedPieceColor;

  if (!movedPieceSquare || !movedPieceColor) {
    return {
      category: null,
      targetSquare: actorInfo.targetSquare || actorInfo.fromSquare || "",
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const enemyColor = getOppositeColor(movedPieceColor);
  const resolvedInitialGame = initialGame || loadGameFromFen(initialFen);
  const capturedPieces = collectCapturedPieces(previousGame, nextGame, movedPieceColor);
  const capturedImportantPieces = capturedPieces.filter((piece) =>
    isImportantPieceType(piece.type)
  );
  const favorableTrade =
    capturedImportantPieces.length > 0;

  if (nextGame.isCheckmate() || nextGame.inCheck()) {
    return {
      category: MEME_CATEGORIES.CHECK,
      targetSquare: findKingSquare(nextGame, enemyColor) || movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (
    createsBadSacrifice({
      previousGame,
      nextGame,
      actorInfo,
      capturedPieces,
    })
  ) {
    return {
      category: MEME_CATEGORIES.SACRIFICE,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const attackedPieces = collectAttackedPieces(
    nextGame,
    movedPieceSquare,
    movedPieceColor
  );
  const attackedImportantPieces = collectAttackedImportantPieces(attackedPieces);

  if (
    createsAttack(attackedPieces) ||
    createsFork(attackedImportantPieces) ||
    createsPin(
      nextGame,
      movedPieceSquare,
      movedPieceColor,
      actorInfo.movedPieceType
    )
  ) {
    return {
      category: MEME_CATEGORIES.FORK_PIN,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (favorableTrade) {
    return {
      category: MEME_CATEGORIES.IMPORTANT_CAPTURE,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (
    isImportantPieceType(actorInfo.movedPieceType) &&
    movedFromInitialSquare(resolvedInitialGame, previousGame, actorInfo)
  ) {
    return {
      category: MEME_CATEGORIES.DEVELOPMENT,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const nextOrdinaryMoveCount = ordinaryMoveCount + 1;

  return {
    category: MEME_CATEGORIES.DEVELOPMENT,
    targetSquare: movedPieceSquare,
    nextOrdinaryMoveCount,
  };
}

export function rebuildOrdinaryMoveCountFromServerMoves({
  serverMoves = [],
  initialFen = "",
}) {
  if (!Array.isArray(serverMoves) || serverMoves.length === 0) {
    return 0;
  }

  let ordinaryMoveCount = 0;
  let previousFen = initialFen;
  const initialGame = loadGameFromFen(initialFen);

  serverMoves.forEach((moveEntry) => {
    const previousGame = loadGameFromFen(previousFen);
    const nextGame = loadGameFromFen(moveEntry?.fen);

    if (!previousGame || !nextGame) {
      previousFen = moveEntry?.fen || previousFen;
      return;
    }

    const analysis = analyzeMoveForMeme({
      previousGame,
      nextGame,
      sequence: parseMoveSequence(moveEntry?.move),
      initialFen,
      initialGame,
      ordinaryMoveCount,
    });

    ordinaryMoveCount = analysis.nextOrdinaryMoveCount;
    previousFen = moveEntry?.fen || previousFen;
  });

  return ordinaryMoveCount;
}
