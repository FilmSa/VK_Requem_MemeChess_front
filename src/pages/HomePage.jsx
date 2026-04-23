import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ChessBoardSection from "../features/chess/ui/ChessBoardSection.jsx";
import MainMenuPanel from "../features/main-menu/ui/MainMenuPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";
import { useResponsiveWorkspaceLayout } from "../features/chess/hooks/useResponsiveWorkspaceLayout.js";

export default function HomePage() {
  const chessGameState = useChessGame();
  const { viewportRef, layout, handleBoardMetricsChange } =
    useResponsiveWorkspaceLayout();

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="app-page__grid">
        <AppSidebar />

        <main className="flex h-full min-h-0 flex-1 overflow-hidden px-[clamp(20px,3vw,60px)] py-[clamp(16px,2.2vh,24px)]">
          <div
            ref={viewportRef}
            className="mx-auto flex h-full w-full min-w-0 items-start justify-center overflow-hidden"
            style={{ gap: layout.contentGap }}
          >
            <div className="flex h-full min-w-0 flex-1 justify-center overflow-hidden">
              <ChessBoardSection
                gameState={chessGameState}
                enableSocket={false}
                boardWidth={layout.boardSize}
                onLayoutMetricsChange={handleBoardMetricsChange}
              />
            </div>

            <div
              className="shrink-0"
              style={{
                width: layout.panelWidth,
              }}
            >
              <MainMenuPanel
                style={{
                  width: "100%",
                  height: layout.panelHeight,
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
