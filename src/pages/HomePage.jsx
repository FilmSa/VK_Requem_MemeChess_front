import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ChessBoardSection from "../features/chess/ui/ChessBoardSection.jsx";
import MainMenuPanel from "../features/main-menu/ui/MainMenuPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";

export default function HomePage() {
  const chessGameState = useChessGame();

  return (
    <div className="app-page h-screen w-screen">
      <div className="app-page__grid">
        <AppSidebar />

        <main className="flex h-full items-start justify-center gap-[50px] px-[60px] pt-[24px]">
          <div className="flex justify-center">
            <ChessBoardSection
              gameState={chessGameState}
              enableSocket={false}
            />
          </div>

          <div className="flex-shrink-0">
            <MainMenuPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
