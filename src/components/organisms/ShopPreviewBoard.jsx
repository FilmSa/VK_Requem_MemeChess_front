import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { createCustomPieces } from "../../features/chess/lib/boardPieces.jsx";
import {
  getBoardSkinConfig,
  readStoredBoardSkin,
  subscribeBoardSkinChanges,
} from "../../shared/lib/boardSkin.js";

export default function ShopPreviewBoard({
  boardWidth = 720,
  boardOrientation = "white",
  pieceSkinId,
}) {
  const [game, setGame] = useState(() => new Chess());
  const [selectedBoardSkin, setSelectedBoardSkin] = useState(() =>
    readStoredBoardSkin()
  );

  const customPieces = createCustomPieces(pieceSkinId);
  const boardSkinConfig = useMemo(
    () => getBoardSkinConfig(selectedBoardSkin),
    [selectedBoardSkin]
  );

  useEffect(() => {
    return subscribeBoardSkinChanges((skinId) => {
      setSelectedBoardSkin(skinId);
    });
  }, []);

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
        customLightSquareStyle={{ backgroundColor: boardSkinConfig.lightSquare }}
        customDarkSquareStyle={{ backgroundColor: boardSkinConfig.darkSquare }}
      />
    </div>
  );
}
