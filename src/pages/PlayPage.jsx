import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../components/organisms/Sidebar.jsx";
import ChessBoardSection from "../components/organisms/ChessBoardSection.jsx";
import GameSettingsPanel from "../components/organisms/GameSettingsPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";
import { DEFAULT_AVATAR } from "../features/chess/lib/boardConfig.js";
import { useAuth } from "../features/auth/useAuth.js";
import { getGameParticipants } from "../features/game/gameApi.js";
import { readPlaySession } from "../features/game/playSession.js";

function buildOnlineIdentity({ authUser, authToken, locationState, storedSession }) {
  return {
    token:
      authToken ||
      locationState?.sessionToken ||
      storedSession?.sessionToken ||
      "",
    user: authUser || locationState?.player || storedSession?.player || null,
  };
}

function renderStatusCard(title, description, action) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] px-4 py-8 text-white">
      <div className="w-full max-w-[620px] rounded-[28px] border border-white/10 bg-[#121533]/90 px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
        <div className="text-[30px] font-semibold">{title}</div>
        <div className="mt-3 text-[16px] leading-7 text-[#d5dcff]">
          {description}
        </div>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
    </div>
  );
}

function normalizeProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id || "",
    username: profile.username || "",
    avatar_url: profile.avatar_url || "",
  };
}

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { token, user, isInitializing } = useAuth();

  const gameId = searchParams.get("game") || "";
  const storedSession = useMemo(() => readPlaySession(gameId), [gameId]);
  const onlineIdentity = buildOnlineIdentity({
    authUser: user,
    authToken: token,
    locationState: location.state,
    storedSession,
  });

  const [roomState, setRoomState] = useState(null);
  const [socketError, setSocketError] = useState("");
  const [participants, setParticipants] = useState(null);

  const isOnlineGame = Boolean(gameId);
  const isWaitingForAuthBootstrap =
    isOnlineGame && Boolean(token) && isInitializing && !user;
  const hasOnlineAccess = Boolean(onlineIdentity.token && onlineIdentity.user?.id);
  const playerColor =
    roomState && onlineIdentity.user?.id === roomState.player1_id ? "w" : "b";

  const chessGameState = useChessGame({
    playerColor: roomState ? playerColor : "w",
  });

  useEffect(() => {
    if (!isOnlineGame || !hasOnlineAccess) {
      setParticipants(null);
      return undefined;
    }

    let cancelled = false;

    async function loadParticipants() {
      try {
        const response = await getGameParticipants(gameId, onlineIdentity.token);
        if (cancelled) {
          return;
        }
        setParticipants(response);
      } catch {
        if (cancelled) {
          return;
        }
      }
    }

    loadParticipants();

    return () => {
      cancelled = true;
    };
  }, [
    gameId,
    hasOnlineAccess,
    isOnlineGame,
    onlineIdentity.token,
    roomState?.player1_id,
    roomState?.player2_id,
  ]);

  if (isWaitingForAuthBootstrap) {
    return renderStatusCard(
      "Подключаем к игре",
      "Проверяем сохранённую сессию перед входом в комнату..."
    );
  }

  if (isOnlineGame && !hasOnlineAccess) {
    return renderStatusCard(
      "Сессия игры не найдена",
      "Откройте ссылку-приглашение снова, чтобы восстановить корректную игровую сессию для этой комнаты.",
      <Link
        to="/"
        className="rounded-[16px] bg-[#2fc8e3] px-5 py-3 text-[15px] font-medium text-[#06112c] no-underline"
      >
        На главную
      </Link>
    );
  }

  function handleJoined(state) {
    setSocketError("");
    setRoomState(state);
    chessGameState.syncFromServerState(state);
  }

  function handleStateChange(state) {
    setSocketError("");
    setRoomState(state);

    const serverMoveCount = Array.isArray(state?.moves) ? state.moves.length : 0;
    if (serverMoveCount !== chessGameState.moveCount) {
      chessGameState.syncFromServerState(state);
    }
  }

  function handleSocketError(error) {
    setSocketError(error?.message || "Не удалось подключиться к игровой комнате.");
  }

  const currentUserProfile =
    normalizeProfile(participants?.player1)?.id === onlineIdentity.user?.id
      ? normalizeProfile(participants?.player1)
      : normalizeProfile(participants?.player2)?.id === onlineIdentity.user?.id
        ? normalizeProfile(participants?.player2)
        : normalizeProfile(onlineIdentity.user);

  const opponentProfile =
    normalizeProfile(participants?.player1)?.id &&
    normalizeProfile(participants?.player1)?.id !== onlineIdentity.user?.id
      ? normalizeProfile(participants?.player1)
      : normalizeProfile(participants?.player2)?.id &&
          normalizeProfile(participants?.player2)?.id !== onlineIdentity.user?.id
        ? normalizeProfile(participants?.player2)
        : null;

  const currentUserName =
    currentUserProfile?.username || (isOnlineGame ? "Игрок" : "Вы");
  const opponentName =
    opponentProfile?.username || (isOnlineGame ? "Ожидаем игрока" : "Соперник");

  const socketOptions = isOnlineGame
    ? {
        gameId,
        userId: onlineIdentity.user?.id,
        token: onlineIdentity.token,
        onJoined: handleJoined,
        onStateChange: handleStateChange,
        onError: handleSocketError,
      }
    : undefined;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] text-white">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar />
        <main className="flex h-full flex-1 items-start gap-4 overflow-hidden">
          <div className="ml-[50px] mt-[34px] flex flex-col">
            <ChessBoardSection
              gameState={chessGameState}
              enableSocket={Boolean(isOnlineGame && hasOnlineAccess)}
              socketOptions={socketOptions}
              topPlayerName={opponentName}
              topPlayerAvatar={opponentProfile?.avatar_url || DEFAULT_AVATAR}
              bottomPlayerName={currentUserName}
              bottomPlayerAvatar={currentUserProfile?.avatar_url || DEFAULT_AVATAR}
            />

            {socketError ? (
              <div className="mt-3 text-[13px] text-[#ffd5d5]">{socketError}</div>
            ) : null}
          </div>

          <GameSettingsPanel
            history={chessGameState.game.history()}
            deposit={1000}
            actionsDisabled
            style={{ marginTop: "78px" }}
          />
        </main>
      </div>
    </div>
  );
}
