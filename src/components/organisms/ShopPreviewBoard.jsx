import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { createCustomPieces } from "../../features/chess/lib/boardPieces.jsx";

export default function ShopPreviewBoard({
  boardWidth = 720,
  boardOrientation = "white",
  pieceSkinId,
}) {
  const [game, setGame] = useState(() => new Chess());

  const customPieces = createCustomPieces(pieceSkinId);

  function onPieceDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) {
      return false;
    }

    setGame(gameCopy);
    return true;
  }

  return (
    <div className="flex justify-center">
      <Chessboard
        id="ShopPreviewBoard"
        position={game.fen()}
        onPieceDrop={onPieceDrop}
        boardWidth={boardWidth}
        boardOrientation={boardOrientation}
        customPieces={customPieces}
        customLightSquareStyle={{ backgroundColor: "#c8cfdb" }}
        customDarkSquareStyle={{ backgroundColor: "#aab3c8" }}
      />
    </div>
  );
}