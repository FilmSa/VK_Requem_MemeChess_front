import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { getGameParams } from "../lib/gameParams";
import { useBoardEffects } from "./useBoardEffects";

const DEBUG_SHOW_EFFECT_ON_ANY_MOVE = true;

export function useChessGame() {
  const { playerColor, boardOrientation } = getGameParams();

  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});

  const { activeEffects, effect, clearEffects } = useBoardEffects();

  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
  }

  function triggerMoveEffect(move) {
  const random = 1;

  effect(String(random), {
    square: move.to,
    from: move.from,
    to: move.to,
    piece: move.piece,
  });
}

  function isPlayersTurn(chessInstance = gameRef.current) {
    return chessInstance.turn() === playerColor;
  }

  function canControlPiece(piece, chessInstance = gameRef.current) {
    if (!piece) return false;
    if (!isPlayersTurn(chessInstance)) return false;
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

  function applyMove({ from, to, promotion = "q" }) {
    const gameCopy = new Chess();
    const history = gameRef.current.history({ verbose: true });

    history.forEach((historyMove) => {
      gameCopy.move(historyMove);
    });

    const move = gameCopy.move({
      from,
      to,
      promotion,
    });

    if (!move) return null;

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

    return !!appliedMove;
  }

  return {
    game,
    highlightedSquares,
    boardOrientation,
    activeEffects,
    effect,
    onSquareClick,
    onPieceDrop,
    applyRemoteMove,
  };
}