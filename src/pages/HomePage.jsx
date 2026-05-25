import { useEffect, useState } from "react";
import { preloadProfilePage, preloadShopPage } from "../App/routeLoaders.js";
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
import { preloadShopCatalog } from "../features/shop/shopApi.js";
import { preloadMyGameHistory } from "../features/game/gameApi.js";
import { useIsMobile } from "../shared/hooks/useMediaQuery.js";
import MobileBottomNav from "../shared/ui/organisms/MobileBottomNav.jsx";

const PROFILE_HISTORY_WARMUP_LIMIT = 10;

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
  topPlayerTimer,
  bottomPlayerTimer,
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
      topPlayerTimer={topPlayerTimer}
      bottomPlayerTimer={bottomPlayerTimer}
      bottomPlayerAvatar={bottomPlayerAvatar}
      bottomPlayerProfileHref={bottomPlayerProfileHref}
      animateIntroPieces={animateIntroPieces}
    />
  );
}

export default function HomePage() {
  const { user, token } = useAuth();
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
  const previewTimer = {
    displayTime: previewClock,
    isTimed: true,
    isActive: false,
  };
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let isCancelled = false;

    const runWarmup = () => {
      if (isCancelled) {
        return;
      }

      void preloadShopPage();
      void preloadProfilePage();
      void preloadShopCatalog(token);

      if (token) {
        void preloadMyGameHistory(token, {
          limit: PROFILE_HISTORY_WARMUP_LIMIT,
          offset: 0,
        });
      }
    };

    const timeoutId = window.setTimeout(runWarmup, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [token]);

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mobile-page">
        <div className="mobile-page__topbar">
          <div className="mobile-page__topbar-left">
            <span className="mobile-page__topbar-logo">Pawn Requiem</span>
            <span className="mobile-page__topbar-sub">Meme Chess</span>
          </div>
        </div>

        <div className="mobile-page__currency-row">
          <div className="mobile-page__currency-pill mobile-page__currency-pill--gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>360</span>
          </div>
          <div className="mobile-page__currency-pill mobile-page__currency-pill--purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>3228</span>
          </div>
        </div>

        <div className="mobile-page__panel-wrap">
          <MainMenuPanel
            style={{ width: "100%", height: "100%" }}
            onPreviewStateChange={setPreviewState}
          />
        </div>

        <MobileBottomNav />
      </div>
    );
  }

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
                topPlayerTimer={previewTimer}
                bottomPlayerTimer={previewTimer}
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
