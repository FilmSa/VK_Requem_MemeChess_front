import { Chess } from "chess.js";

const CHECKMATE_SCORE = 100_000;
const BISHOP_PAIR_BONUS = 40;
const DOUBLED_PAWN_PENALTY = 18;
const ISOLATED_PAWN_PENALTY = 14;
const PASSED_PAWN_BONUS_BY_RANK = [0, 10, 18, 30, 48, 72, 110, 0];
const MOBILITY_WEIGHTS = {
  n: 4,
  b: 5,
  r: 3,
  q: 2,
};
const DIFFICULTY_DEPTH = {
  easy: 5,
  medium: 10,
  hard: 15,
};
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
};
const PIECE_SQUARE_TABLES = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    12, 12, 22, 34, 34, 22, 12, 12,
    6, 8, 12, 26, 26, 12, 8, 6,
    0, 0, 0, 22, 22, 0, 0, 0,
    5, -4, -10, 0, 0, -10, -4, 5,
    5, 10, 10, -22, -22, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -34, -24, -18, -18, -24, -34, -50,
    -32, -10, 0, 6, 6, 0, -10, -32,
    -18, 8, 16, 20, 20, 16, 8, -18,
    -8, 12, 24, 28, 28, 24, 12, -8,
    -8, 8, 24, 30, 30, 24, 8, -8,
    -18, 6, 16, 22, 22, 16, 6, -18,
    -28, -8, 0, 8, 8, 0, -8, -28,
    -44, -26, -18, -12, -12, -18, -26, -44,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 8, 0, 0, 0, 0, 8, -10,
    -10, 12, 12, 14, 14, 12, 12, -10,
    -10, 0, 14, 18, 18, 14, 0, -10,
    -10, 6, 10, 18, 18, 10, 6, -10,
    -10, 10, 10, 12, 12, 10, 10, -10,
    -10, 4, 0, 0, 0, 0, 4, -10,
    -20, -10, -12, -10, -10, -12, -10, -20,
  ],
  r: [
    0, 0, 6, 10, 10, 6, 0, 0,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    8, 12, 12, 12, 12, 12, 12, 8,
    0, 0, 4, 8, 8, 4, 0, 0,
  ],
  q: [
    -20, -10, -10, -4, -4, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 8, 8, 8, 8, 0, -10,
    -4, 0, 8, 10, 10, 8, 0, -4,
    0, 0, 8, 10, 10, 8, 0, -4,
    -10, 6, 8, 8, 8, 8, 0, -10,
    -10, 0, 6, 0, 0, 0, 0, -10,
    -20, -10, -10, -4, -4, -10, -10, -20,
  ],
  k: [
    -34, -24, -24, -28, -28, -24, -24, -34,
    -24, -16, -16, -20, -20, -16, -16, -24,
    -16, -8, -8, -12, -12, -8, -8, -16,
    -10, -2, -2, -10, -10, -2, -2, -10,
    -4, 4, 6, -6, -6, 6, 4, -4,
    8, 12, 10, -2, -2, 10, 12, 8,
    20, 20, 4, 0, 0, 4, 20, 20,
    24, 30, 12, 0, 0, 12, 30, 24,
  ],
};

function resolveDepth(difficulty) {
  return DIFFICULTY_DEPTH[String(difficulty || "").trim().toLowerCase()] || 2;
}

function serializeMove(move) {
  const from = String(move?.from || "").trim().toLowerCase();
  const to = String(move?.to || "").trim().toLowerCase();
  const promotion =
    typeof move?.promotion === "string" && /^[qrbn]$/i.test(move.promotion.trim())
      ? move.promotion.trim().toLowerCase()
      : "";

  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
    return "";
  }

  return `${from}${to}${promotion}`;
}

function getSquareTableIndex(rankIndex, fileIndex, color) {
  const whitePerspectiveIndex = (7 - rankIndex) * 8 + fileIndex;
  if (color === "w") {
    return whitePerspectiveIndex;
  }

  const mirroredRank = 7 - Math.floor(whitePerspectiveIndex / 8);
  const mirroredFile = whitePerspectiveIndex % 8;
  return mirroredRank * 8 + mirroredFile;
}

function getPieceSquareBonus(piece, rankIndex, fileIndex) {
  const table = PIECE_SQUARE_TABLES[piece.type];
  if (!table) {
    return 0;
  }

  return table[getSquareTableIndex(rankIndex, fileIndex, piece.color)] || 0;
}

function collectPawnFiles(board) {
  const files = {
    w: Array.from({ length: 8 }, () => []),
    b: Array.from({ length: 8 }, () => []),
  };

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < board[rankIndex].length; fileIndex += 1) {
      const piece = board[rankIndex][fileIndex];
      if (piece?.type !== "p") {
        continue;
      }

      files[piece.color][fileIndex].push(rankIndex);
    }
  }

  return files;
}

function evaluatePawnStructure(board, perspective) {
  const pawnFiles = collectPawnFiles(board);
  let score = 0;

  for (const color of ["w", "b"]) {
    const direction = color === perspective ? 1 : -1;

    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const pawnsOnFile = pawnFiles[color][fileIndex];
      if (!pawnsOnFile.length) {
        continue;
      }

      if (pawnsOnFile.length > 1) {
        score -= direction * DOUBLED_PAWN_PENALTY * (pawnsOnFile.length - 1);
      }

      const hasLeftSupport = fileIndex > 0 && pawnFiles[color][fileIndex - 1].length > 0;
      const hasRightSupport = fileIndex < 7 && pawnFiles[color][fileIndex + 1].length > 0;
      if (!hasLeftSupport && !hasRightSupport) {
        score -= direction * ISOLATED_PAWN_PENALTY * pawnsOnFile.length;
      }

      for (const rankIndex of pawnsOnFile) {
        const progressIndex = color === "w" ? 7 - rankIndex : rankIndex;
        const enemyColor = color === "w" ? "b" : "w";
        let isPassed = true;

        for (
          let adjacentFile = Math.max(0, fileIndex - 1);
          adjacentFile <= Math.min(7, fileIndex + 1);
          adjacentFile += 1
        ) {
          for (const enemyRankIndex of pawnFiles[enemyColor][adjacentFile]) {
            const blocksAdvance =
              color === "w" ? enemyRankIndex < rankIndex : enemyRankIndex > rankIndex;

            if (blocksAdvance) {
              isPassed = false;
              break;
            }
          }

          if (!isPassed) {
            break;
          }
        }

        if (isPassed) {
          score += direction * (PASSED_PAWN_BONUS_BY_RANK[progressIndex] || 0);
        }
      }
    }
  }

  return score;
}

function countPieces(board, pieceType, color) {
  let count = 0;

  for (const rank of board) {
    for (const piece of rank) {
      if (piece?.type === pieceType && piece.color === color) {
        count += 1;
      }
    }
  }

  return count;
}

function evaluateBoardState(chess, perspective) {
  let score = 0;
  const board = chess.board();

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < board[rankIndex].length; fileIndex += 1) {
      const piece = board[rankIndex][fileIndex];
      if (!piece) {
        continue;
      }

      const pieceValue = PIECE_VALUES[piece.type] || 0;
      const squareBonus = getPieceSquareBonus(piece, rankIndex, fileIndex);
      score += piece.color === perspective
        ? pieceValue + squareBonus
        : -(pieceValue + squareBonus);
    }
  }

  score += evaluatePawnStructure(board, perspective);

  if (countPieces(board, "b", perspective) >= 2) {
    score += BISHOP_PAIR_BONUS;
  }

  const opponent = perspective === "w" ? "b" : "w";
  if (countPieces(board, "b", opponent) >= 2) {
    score -= BISHOP_PAIR_BONUS;
  }

  return score;
}

function evaluateMobility(chess, perspective) {
  const turn = chess.turn();
  let ownMobility = 0;
  let opponentMobility = 0;

  for (const move of chess.moves({ verbose: true })) {
    const weight = MOBILITY_WEIGHTS[move.piece] || 0;
    if (!weight) {
      continue;
    }

    if (turn === perspective) {
      ownMobility += weight;
    } else {
      opponentMobility += weight;
    }
  }

  const nullMoveFen = chess.fen().replace(/\s[wb]\s/, turn === "w" ? " b " : " w ");
  try {
    const opponentView = new Chess(nullMoveFen);
    for (const move of opponentView.moves({ verbose: true })) {
      const weight = MOBILITY_WEIGHTS[move.piece] || 0;
      if (!weight) {
        continue;
      }

      if (turn === perspective) {
        opponentMobility += weight;
      } else {
        ownMobility += weight;
      }
    }
  } catch {
    // Keep mobility heuristic best-effort only.
  }

  return ownMobility - opponentMobility;
}

function evaluatePosition(chess, perspective) {
  if (chess.isCheckmate()) {
    return chess.turn() === perspective ? -CHECKMATE_SCORE : CHECKMATE_SCORE;
  }

  if (
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isInsufficientMaterial() ||
    chess.isThreefoldRepetition()
  ) {
    return 0;
  }

  const boardScore = evaluateBoardState(chess, perspective);
  const mobilityScore = evaluateMobility(chess, perspective);
  const checkPressure = chess.inCheck()
    ? chess.turn() === perspective
      ? -36
      : 36
    : 0;

  return boardScore + mobilityScore + checkPressure;
}

function scoreMove(move) {
  let score = 0;

  if (move.captured) {
    score += 20 + (PIECE_VALUES[move.captured] || 0);
  }

  if (move.promotion) {
    score += 800;
  }

  if (move.san?.includes("+")) {
    score += 40;
  }

  if (move.san?.includes("#")) {
    score += CHECKMATE_SCORE;
  }

  return score;
}

function orderMoves(chess, capturesOnly = false) {
  const moves = chess.moves({ verbose: true });
  const filteredMoves = capturesOnly
    ? moves.filter(
        (move) =>
          Boolean(move.captured) ||
          Boolean(move.promotion) ||
          Boolean(move.san?.includes("+"))
      )
    : moves;

  return filteredMoves.sort((left, right) => scoreMove(right) - scoreMove(left));
}

function quiescenceSearch(chess, alpha, beta, maximizingColor) {
  const standPat = evaluatePosition(chess, maximizingColor);
  const maximizingTurn = chess.turn() === maximizingColor;

  if (maximizingTurn) {
    if (standPat >= beta) {
      return beta;
    }
    alpha = Math.max(alpha, standPat);
  } else {
    if (standPat <= alpha) {
      return alpha;
    }
    beta = Math.min(beta, standPat);
  }

  const moves = orderMoves(chess, true);
  if (!moves.length) {
    return standPat;
  }

  if (maximizingTurn) {
    let bestScore = standPat;

    for (const move of moves) {
      chess.move(move);
      const score = quiescenceSearch(chess, alpha, beta, maximizingColor);
      chess.undo();

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
      if (alpha >= beta) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = standPat;

  for (const move of moves) {
    chess.move(move);
    const score = quiescenceSearch(chess, alpha, beta, maximizingColor);
    chess.undo();

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);
    if (alpha >= beta) {
      break;
    }
  }

  return bestScore;
}

function search(chess, depth, alpha, beta, maximizingColor) {
  if (chess.isGameOver()) {
    return evaluatePosition(chess, maximizingColor);
  }

  if (depth <= 0) {
    return quiescenceSearch(chess, alpha, beta, maximizingColor);
  }

  const maximizingTurn = chess.turn() === maximizingColor;
  const moves = orderMoves(chess);

  if (!moves.length) {
    return evaluatePosition(chess, maximizingColor);
  }

  if (maximizingTurn) {
    let bestScore = -Infinity;

    for (const move of moves) {
      chess.move(move);
      const score = search(chess, depth - 1, alpha, beta, maximizingColor);
      chess.undo();

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = search(chess, depth - 1, alpha, beta, maximizingColor);
    chess.undo();

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, score);
    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function computeBestMove({ fen, difficulty }) {
  const chess = new Chess(fen);
  const maximizingColor = chess.turn();
  const depth = resolveDepth(difficulty);
  const moves = orderMoves(chess);

  if (!moves.length) {
    return {
      move: "",
      score: evaluatePosition(chess, maximizingColor),
    };
  }

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = search(
      chess,
      depth - 1,
      -Infinity,
      Infinity,
      maximizingColor
    );
    chess.undo();

    if (score > bestScore || (score === bestScore && scoreMove(move) > scoreMove(bestMove))) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    move: serializeMove(bestMove),
    score: bestScore,
  };
}

self.onmessage = (event) => {
  const message = event?.data || {};
  const requestId = message.id;

  try {
    if (message.type !== "compute-best-move") {
      throw new Error("Unsupported worker request type.");
    }

    const result = computeBestMove(message.payload || {});
    self.postMessage({
      id: requestId,
      ok: true,
      result,
    });
  } catch (error) {
    self.postMessage({
      id: requestId,
      ok: false,
      error: error instanceof Error ? error.message : "Worker failed.",
    });
  }
};
