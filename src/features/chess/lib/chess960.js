const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const STANDARD_INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function pickRandomIndex(items, randomFn = Math.random) {
  if (!Array.isArray(items) || items.length === 0) {
    return -1;
  }

  const normalizedRandom = Math.min(Math.max(Number(randomFn()) || 0, 0), 0.999999);
  return Math.floor(normalizedRandom * items.length);
}

function buildBackRank(randomFn = Math.random) {
  const backRank = Array(8).fill("");
  const availableFiles = [...FILES.keys()];

  const lightSquares = [1, 3, 5, 7];
  const darkSquares = [0, 2, 4, 6];

  const firstBishopFile = darkSquares[pickRandomIndex(darkSquares, randomFn)];
  backRank[firstBishopFile] = "b";
  availableFiles.splice(availableFiles.indexOf(firstBishopFile), 1);

  const secondBishopFile = lightSquares[pickRandomIndex(lightSquares, randomFn)];
  backRank[secondBishopFile] = "b";
  availableFiles.splice(availableFiles.indexOf(secondBishopFile), 1);

  const queenFile = availableFiles.splice(
    pickRandomIndex(availableFiles, randomFn),
    1
  )[0];
  backRank[queenFile] = "q";

  const firstKnightFile = availableFiles.splice(
    pickRandomIndex(availableFiles, randomFn),
    1
  )[0];
  backRank[firstKnightFile] = "n";

  const secondKnightFile = availableFiles.splice(
    pickRandomIndex(availableFiles, randomFn),
    1
  )[0];
  backRank[secondKnightFile] = "n";

  const [rookLeftFile, kingFile, rookRightFile] = [...availableFiles].sort(
    (left, right) => left - right
  );
  backRank[rookLeftFile] = "r";
  backRank[kingFile] = "k";
  backRank[rookRightFile] = "r";

  return backRank.join("");
}

export function buildStandardInitialFen() {
  return STANDARD_INITIAL_FEN;
}

export function buildChess960InitialFen(randomFn = Math.random) {
  const backRank = buildBackRank(randomFn);
  const whiteBackRank = backRank.toUpperCase();

  return [
    backRank,
    "pppppppp",
    "8",
    "8",
    "8",
    "8",
    "PPPPPPPP",
    whiteBackRank,
  ].join("/") + " w - - 0 1";
}
