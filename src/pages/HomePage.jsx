import { useEffect, useState } from "react";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ChessBoardSection from "../features/chess/ui/ChessBoardSection.jsx";
import MainMenuPanel from "../features/main-menu/ui/MainMenuPanel.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";
import { useResponsiveWorkspaceLayout } from "../features/chess/hooks/useResponsiveWorkspaceLayout.js";
import {
  DEFAULT_CARD_IDS,
  MODE_OPTIONS,
  resolveMatchmakingGameMode,
  resolveSelectedTimeControl,
} from "../features/main-menu/config/menuConfig.js";
import { buildStandardInitialFen } from "../features/chess/lib/chess960.js";

function formatPreviewClock(baseMs) {
  if (!Number.isFinite(baseMs) || baseMs <= 0) {
    return "∞";
  }

  const totalSeconds = Math.max(0, Math.ceil(baseMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function HomePreviewBoard({
  initialFen,
  gameMode,
  boardWidth,
  onLayoutMetricsChange,
  topPlayerTime,
  bottomPlayerTime,
  bottomPlayerAvatar,
  bottomPlayerProfileHref,
  animateIntroPieces,
}) {
  const chessGameState = useChessGame({
    allowBothColors: true,
    gameMode,
    initialFen,
  });

  return (
    <ChessBoardSection
      gameState={chessGameState}
      boardWidth={boardWidth}
      onLayoutMetricsChange={onLayoutMetricsChange}
      topPlayerTime={topPlayerTime}
      bottomPlayerTime={bottomPlayerTime}
      bottomPlayerAvatar={bottomPlayerAvatar}
      bottomPlayerProfileHref={bottomPlayerProfileHref}
      animateIntroPieces={animateIntroPieces}
    />
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { viewportRef, layout, handleBoardMetricsChange } =
    useResponsiveWorkspaceLayout();
  const defaultTimeControl = resolveSelectedTimeControl(DEFAULT_CARD_IDS.new);
  const [previewState, setPreviewState] = useState(() => ({
    gameMode: resolveMatchmakingGameMode(MODE_OPTIONS[0]),
    timeControlBaseMs: defaultTimeControl.baseMs ?? 0,
    initialFen: buildStandardInitialFen(),
  }));
  const [animateIntroPieces, setAnimateIntroPieces] = useState(false);
  const previewClock = formatPreviewClock(previewState.timeControlBaseMs);
  const previewBoardKey = `${previewState.gameMode}:${previewState.initialFen}`;

  useEffect(() => {
    setAnimateIntroPieces(true);

    const stopAnimationTimer = window.setTimeout(() => {
      setAnimateIntroPieces(false);
    }, 2200);

    return () => {
      clearTimeout(stopAnimationTimer);
    };
  }, [previewBoardKey]);

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
              <HomePreviewBoard
                key={previewBoardKey}
                initialFen={previewState.initialFen}
                gameMode={previewState.gameMode}
                boardWidth={layout.boardSize}
                onLayoutMetricsChange={handleBoardMetricsChange}
                topPlayerTime={previewClock}
                bottomPlayerTime={previewClock}
                bottomPlayerAvatar={user?.avatar_url || undefined}
                bottomPlayerProfileHref={user?.id ? "/profile" : ""}
                animateIntroPieces={animateIntroPieces}
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
                onPreviewStateChange={setPreviewState}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
