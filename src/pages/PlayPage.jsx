import { Link, useSearchParams } from "react-router-dom";
import Button from "../shared/ui/atoms/Button.jsx";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ChessBoardSection from "../features/chess/ui/ChessBoardSection.jsx";
import GameSettingsPanel from "../features/game/ui/GameSettingsPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";
import { DEFAULT_AVATAR } from "../features/chess/lib/boardConfig.js";
import { useOnlineGameRoom } from "../features/game/model/useOnlineGameRoom.js";

function StatusCard({ title, description, action }) {
  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-[620px] rounded-[28px] border px-8 py-8"
        style={{
          borderColor: "var(--status-card-border)",
          background: "var(--status-card-background)",
          boxShadow: "var(--status-card-shadow)",
        }}
      >
        <div className="text-[30px] font-semibold">{title}</div>
        <div
          className="mt-3 text-[16px] leading-7"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </div>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
    </div>
  );
}

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game") || "";

  const onlineRoom = useOnlineGameRoom(gameId);
  const chessGameState = useChessGame({
    playerColor: onlineRoom.playerColor,
  });

  const socketOptions = onlineRoom.buildSocketOptions(chessGameState);

  if (onlineRoom.isWaitingForAuthBootstrap) {
    return (
      <StatusCard
        title="РџРѕРґРєР»СЋС‡Р°РµРј Рє РёРіСЂРµ"
        description="РџСЂРѕРІРµСЂСЏРµРј СЃРѕС…СЂР°РЅРµРЅРЅСѓСЋ СЃРµСЃСЃРёСЋ РїРµСЂРµРґ РІС…РѕРґРѕРј РІ РєРѕРјРЅР°С‚Сѓ..."
      />
    );
  }

  if (onlineRoom.isOnlineGame && !onlineRoom.hasOnlineAccess) {
    return (
      <StatusCard
        title="РЎРµСЃСЃРёСЏ РёРіСЂС‹ РЅРµ РЅР°Р№РґРµРЅР°"
        description="РћС‚РєСЂРѕР№С‚Рµ СЃСЃС‹Р»РєСѓ-РїСЂРёРіР»Р°С€РµРЅРёРµ Р·Р°РЅРѕРІРѕ, С‡С‚РѕР±С‹ РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ РєРѕСЂСЂРµРєС‚РЅСѓСЋ РёРіСЂРѕРІСѓСЋ СЃРµСЃСЃРёСЋ РґР»СЏ СЌС‚РѕР№ РєРѕРјРЅР°С‚С‹."
        action={
          <Link to="/" style={{ textDecoration: "none" }}>
            <Button variant="primary">РќР° РіР»Р°РІРЅСѓСЋ</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden">
        <AppSidebar />
        <main className="flex h-full items-start justify-center gap-[50px] px-[60px] pt-[24px]">
          <div className="flex justify-center">
            <div className="flex min-w-0 flex-1 flex-col">
            <ChessBoardSection
              gameState={chessGameState}
              enableSocket={Boolean(
                onlineRoom.isOnlineGame && onlineRoom.hasOnlineAccess
              )}
              socketOptions={socketOptions}
              topPlayerName={onlineRoom.opponentName}
              topPlayerAvatar={
                onlineRoom.opponentProfile?.avatar_url || DEFAULT_AVATAR
              }
              bottomPlayerName={onlineRoom.currentUserName}
              bottomPlayerAvatar={
                onlineRoom.currentUserProfile?.avatar_url || DEFAULT_AVATAR
              }
            />

            {onlineRoom.socketError ? (
              <div
                className="mt-3 text-[13px]"
                style={{ color: "var(--auth-error-text)" }}
              >
                {onlineRoom.socketError}
              </div>
            ) : null}
            </div>
          </div>

          <div className="flex-shrink-0">
            <GameSettingsPanel
              history={chessGameState.game.history()}
              activeHistoryPly={chessGameState.activeHistoryPly}
              canViewPrevious={chessGameState.canViewPrevious}
              canViewNext={chessGameState.canViewNext}
              onPreviousMove={chessGameState.viewPreviousMove}
              onNextMove={chessGameState.viewNextMove}
              actionsDisabled
            />
          </div>
        </main>
      </div>
    </div>
  );
}
