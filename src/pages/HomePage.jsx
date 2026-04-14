import Sidebar from "../components/organisms/Sidebar.jsx";
import ChessBoardSection from "../components/organisms/ChessBoardSection";
import MainMenuPanel from "../components/organisms/MainMenuPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";

export default function HomePage() {
  const chessGameState = useChessGame();
  return (
  <div className="w-screen h-screen overflow-hidden text-white bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)]">
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <main className="flex h-full flex-1 items-start overflow-hidden px-[24px] pt-[24px]">
        <div className="ml-[12px] flex flex-shrink-0 items-start justify-start">
          <ChessBoardSection gameState={chessGameState} enableSocket={false} />
        </div>

        <div className="ml-[32px] flex h-full flex-shrink-0 items-start justify-start">
          <MainMenuPanel />
        </div>
      </main>
    </div>
  </div>
);
}
