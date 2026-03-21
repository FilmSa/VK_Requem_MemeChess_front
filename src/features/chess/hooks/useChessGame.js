import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { getGameParams } from "../lib/gameParams";

export function useChessGame() {
  const { playerColor, boardOrientation } = getGameParams();

  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});

  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  function clearSelection() {
    setSelectedSquare(null);
    setHighlightedSquares({});
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
    const moves = gameRef.current.moves({ verbose: true });
    const history = gameRef.current.history({ verbose: true });
    
    history.forEach(move => {
      gameCopy.move(move);
    });

    const move = gameCopy.move({
      from,
      to,
      promotion,
    });

    if (!move) return false;

    setGame(gameCopy);
    clearSelection();

    return true;
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
      const moved = applyMove({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (moved) {
        sendMove?.({
          from: selectedSquare,
          to: square,
          promotion: "q",
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

    const moved = applyMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (moved) {
      sendMove?.({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    }

    return moved;
  }

  function applyRemoteMove(move) {
    return applyMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q",
    });
  }

  return {
    game,
    highlightedSquares,
    boardOrientation,
    onSquareClick,
    onPieceDrop,
    applyRemoteMove,
  };
}