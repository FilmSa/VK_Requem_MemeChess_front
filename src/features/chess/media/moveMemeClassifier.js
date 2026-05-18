import { Chess } from "chess.js";
import { MEME_CATEGORIES } from "./memeConfig.js";

const IMPORTANT_PIECE_TYPES = new Set(["n", "b", "r", "q"]);
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
const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

function getOppositeColor(color) {
  return color === "b" ? "w" : "b";
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

function isImportantPieceType(pieceType) {
  return IMPORTANT_PIECE_TYPES.has(String(pieceType || "").toLowerCase());
}

function getPieceValue(pieceType) {
  return PIECE_VALUES[String(pieceType || "").toLowerCase()] ?? 0;
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

function resolveActorInfo({ move = null, sequence = null, previousGame = null, nextGame = null }) {
  const normalizedSequence = Array.isArray(sequence) ? sequence.filter(Boolean) : [];
  const firstStep = normalizedSequence[0] || null;
  const lastStep = normalizedSequence[normalizedSequence.length - 1] || null;
  const fromSquare = move?.from || firstStep?.from || "";
  const toSquare = move?.to || lastStep?.to || fromSquare || "";
  const previousPiece = fromSquare ? previousGame?.get(fromSquare) : null;
  const nextPiece = toSquare ? nextGame?.get(toSquare) : null;

  return {
    fromSquare,
    targetSquare: toSquare || fromSquare,
    movedPieceType:
      move?.piece || nextPiece?.type || previousPiece?.type || move?.promotion || "",
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

function collectAttackedEnemyPieces(nextGame, actorSquare, actorColor) {
  if (!nextGame || !actorSquare || !actorColor) {
    return [];
  }

  const enemyColor = getOppositeColor(actorColor);

  return BOARD_SQUARES.map((square) => {
    const piece = nextGame.get(square);

    if (!piece || piece.color !== enemyColor) {
      return null;
    }

    const attackers = nextGame.attackers(square, actorColor);
    if (!Array.isArray(attackers) || !attackers.includes(actorSquare)) {
      return null;
    }

    return {
      ...piece,
      square,
    };
  }).filter(Boolean);
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

function isSacrificeMove(nextGame, actorSquare, actorColor, movedPieceType) {
  if (
    !nextGame ||
    !actorSquare ||
    !actorColor ||
    !isImportantPieceType(movedPieceType)
  ) {
    return false;
  }

  const enemyColor = getOppositeColor(actorColor);
  const enemyAttackers = nextGame.attackers(actorSquare, enemyColor);

  if (!Array.isArray(enemyAttackers) || enemyAttackers.length === 0) {
    return false;
  }

  const friendlyDefenders = (nextGame.attackers(actorSquare, actorColor) || []).filter(
    (square) => square !== actorSquare
  );
  const movedPieceValue = getPieceValue(movedPieceType);
  const cheapestEnemyAttackerValue = Math.min(
    ...enemyAttackers.map((square) => getPieceValue(nextGame.get(square)?.type))
  );
  const cheapestFriendlyDefenderValue =
    friendlyDefenders.length > 0
      ? Math.min(
          ...friendlyDefenders.map((square) => getPieceValue(nextGame.get(square)?.type))
        )
      : Number.POSITIVE_INFINITY;

  return (
    friendlyDefenders.length === 0 ||
    enemyAttackers.length > friendlyDefenders.length ||
    (cheapestEnemyAttackerValue <= movedPieceValue &&
      cheapestEnemyAttackerValue < cheapestFriendlyDefenderValue)
  );
}

function isPawnCaptureSacrifice({
  nextGame,
  movedPieceSquare,
  movedPieceColor,
  movedPieceType,
  capturedPieces,
}) {
  if (
    !nextGame ||
    !movedPieceSquare ||
    !movedPieceColor ||
    !isImportantPieceType(movedPieceType)
  ) {
    return false;
  }

  if (!capturedPieces.some((piece) => piece.type === "p")) {
    return false;
  }

  const enemyColor = getOppositeColor(movedPieceColor);
  const enemyAttackers = nextGame.attackers(movedPieceSquare, enemyColor);

  return Array.isArray(enemyAttackers) && enemyAttackers.length > 0;
}

function isDevelopmentMove({
  actorInfo,
  capturedPieces,
  previousGame,
  initialGame,
}) {
  if (capturedPieces.some((piece) => piece.type === "p")) {
    return true;
  }

  if (!initialGame || !previousGame || !isImportantPieceType(actorInfo.movedPieceType)) {
    if (actorInfo.movedPieceType !== "p") {
      return false;
    }
  }

  const initialPiece = initialGame.get(actorInfo.fromSquare);
  const previousPiece = previousGame.get(actorInfo.fromSquare);

  return (
    Boolean(actorInfo.fromSquare) &&
    initialPiece?.type === actorInfo.movedPieceType &&
    initialPiece.color === actorInfo.movedPieceColor &&
    previousPiece?.type === actorInfo.movedPieceType &&
    previousPiece.color === actorInfo.movedPieceColor
  );
}

export function analyzeMoveForMeme({
  previousGame,
  nextGame,
  move = null,
  sequence = null,
  initialFen = "",
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
      targetSquare: "",
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const enemyColor = getOppositeColor(movedPieceColor);
  const initialGame = loadGameFromFen(initialFen);
  const capturedPieces = collectCapturedPieces(previousGame, nextGame, movedPieceColor);

  if (
    nextGame.isCheckmate() ||
    capturedPieces.some((piece) => isImportantPieceType(piece.type))
  ) {
    return {
      category: MEME_CATEGORIES.IMPORTANT_CAPTURE,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (nextGame.inCheck()) {
    return {
      category: MEME_CATEGORIES.CHECK,
      targetSquare: findKingSquare(nextGame, enemyColor),
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (
    isPawnCaptureSacrifice({
      nextGame,
      movedPieceSquare,
      movedPieceColor,
      movedPieceType: actorInfo.movedPieceType,
      capturedPieces,
    })
  ) {
    return {
      category: MEME_CATEGORIES.SACRIFICE,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const attackedEnemyPieces = collectAttackedEnemyPieces(
    nextGame,
    movedPieceSquare,
    movedPieceColor
  );
  const attackedImportantPieces = attackedEnemyPieces.filter((piece) =>
    isImportantPieceType(piece.type)
  );

  if (
    attackedImportantPieces.length > 0 ||
    createsPin(nextGame, movedPieceSquare, movedPieceColor, actorInfo.movedPieceType)
  ) {
    return {
      category: MEME_CATEGORIES.FORK_PIN,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (
    isSacrificeMove(
      nextGame,
      movedPieceSquare,
      movedPieceColor,
      actorInfo.movedPieceType
    )
  ) {
    return {
      category: MEME_CATEGORIES.SACRIFICE,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  if (
    isDevelopmentMove({
      actorInfo,
      capturedPieces,
      previousGame,
      initialGame,
    })
  ) {
    return {
      category: MEME_CATEGORIES.DEVELOPMENT,
      targetSquare: movedPieceSquare,
      nextOrdinaryMoveCount: ordinaryMoveCount,
    };
  }

  const nextOrdinaryMoveCount = ordinaryMoveCount + 1;

  return {
    category:
      nextOrdinaryMoveCount % 3 === 0 ? MEME_CATEGORIES.DEVELOPMENT : null,
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
      ordinaryMoveCount,
    });

    ordinaryMoveCount = analysis.nextOrdinaryMoveCount;
    previousFen = moveEntry?.fen || previousFen;
  });

  return ordinaryMoveCount;
}
