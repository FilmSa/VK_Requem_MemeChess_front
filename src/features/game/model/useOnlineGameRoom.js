import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { getGameParticipants } from "../gameApi.js";
import { readPlaySession } from "../playSession.js";

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

function normalizeMatch(match) {
  if (!match || typeof match !== "object") {
    return null;
  }

  const agreedStake = Number(match.agreedStake ?? match.agreed_stake ?? 0);
  const gameMode = String(match.gameMode || match.game_mode || "")
    .trim()
    .toLowerCase();
  const gameCurrency = String(match.gameCurrency || match.game_currency || "").trim();

  return {
    agreedStake: Number.isFinite(agreedStake) ? agreedStake : 0,
    gameMode,
    gameCurrency,
  };
}

function resolveMatchGameModeLabel(gameMode) {
  if (gameMode === "meme") {
    return "Мемы";
  }

  if (gameMode === "classic") {
    return "Классика";
  }

  return "";
}

function resolveMatchCurrencyLabel(gameCurrency) {
  if (!gameCurrency || gameCurrency === "game_currency") {
    return "Игровая валюта";
  }

  return gameCurrency;
}

export function useOnlineGameRoom(gameId) {
  const location = useLocation();
  const { token, user, isInitializing } = useAuth();

  const storedSession = useMemo(() => readPlaySession(gameId), [gameId]);
  const onlineIdentity = useMemo(
    () =>
      buildOnlineIdentity({
        authUser: user,
        authToken: token,
        locationState: location.state,
        storedSession,
      }),
    [location.state, storedSession, token, user]
  );
  const match = useMemo(
    () => normalizeMatch(location.state?.match) || normalizeMatch(storedSession?.match),
    [location.state, storedSession]
  );

  const [roomState, setRoomState] = useState(null);
  const [socketError, setSocketError] = useState("");
  const [participants, setParticipants] = useState(null);

  const isOnlineGame = Boolean(gameId);
  const isWaitingForAuthBootstrap =
    isOnlineGame && Boolean(token) && isInitializing && !user;
  const hasOnlineAccess = Boolean(onlineIdentity.token && onlineIdentity.user?.id);
  const playerColor = roomState
    ? onlineIdentity.user?.id === roomState.player1_id
      ? "w"
      : "b"
    : "w";
  const visibleParticipants = hasOnlineAccess ? participants : null;

  useEffect(() => {
    if (!isOnlineGame || !hasOnlineAccess) {
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
        if (!cancelled) {
          setParticipants(null);
        }
      }
    }

    loadParticipants();

    return () => {
      cancelled = true;
    };
  }, [gameId, hasOnlineAccess, isOnlineGame, onlineIdentity.token]);

  const currentUserProfile = useMemo(() => {
    const player1 = normalizeProfile(visibleParticipants?.player1);
    const player2 = normalizeProfile(visibleParticipants?.player2);

    if (player1?.id === onlineIdentity.user?.id) {
      return player1;
    }

    if (player2?.id === onlineIdentity.user?.id) {
      return player2;
    }

    return normalizeProfile(onlineIdentity.user);
  }, [onlineIdentity.user, visibleParticipants?.player1, visibleParticipants?.player2]);

  const opponentProfile = useMemo(() => {
    const player1 = normalizeProfile(visibleParticipants?.player1);
    const player2 = normalizeProfile(visibleParticipants?.player2);

    if (player1?.id && player1.id !== onlineIdentity.user?.id) {
      return player1;
    }

    if (player2?.id && player2.id !== onlineIdentity.user?.id) {
      return player2;
    }

    return null;
  }, [
    onlineIdentity.user?.id,
    visibleParticipants?.player1,
    visibleParticipants?.player2,
  ]);

  const currentUserId = String(
    currentUserProfile?.id || onlineIdentity.user?.id || ""
  ).trim();
  const opponentUserId =
    String(opponentProfile?.id || "").trim() ||
    (currentUserId && roomState?.player1_id === currentUserId
      ? String(roomState?.player2_id || "").trim()
      : String(roomState?.player1_id || "").trim());

  const currentUserName =
    currentUserProfile?.username || (isOnlineGame ? "Игрок" : "Вы");
  const opponentName =
    opponentProfile?.username ||
    (isOnlineGame ? "Ожидаем игрока" : "Соперник");

  const buildSocketOptions = useCallback(
    (chessGameState) => {
      if (!isOnlineGame || !hasOnlineAccess) {
        return undefined;
      }

      return {
        gameId,
        userId: onlineIdentity.user?.id,
        token: onlineIdentity.token,
        onJoined: (state) => {
          setSocketError("");
          setRoomState(state);
          chessGameState.syncFromServerState(state);
        },
        onStateChange: (state) => {
          setSocketError("");
          setRoomState(state);

          const localFen = chessGameState.getCurrentFen?.() || "";
          const shouldSyncByFen =
            Boolean(state?.fen) && Boolean(localFen) && state.fen !== localFen;
          const shouldSyncByMoveCount =
            !state?.fen &&
            Array.isArray(state?.moves) &&
            state.moves.length !== chessGameState.moveCount;

          if (shouldSyncByFen || shouldSyncByMoveCount) {
            chessGameState.syncFromServerState(state);
          }
        },
        onError: (error) => {
          setSocketError(
            error?.message || "Не удалось подключиться к игровой комнате."
          );
        },
      };
    },
    [
      gameId,
      hasOnlineAccess,
      isOnlineGame,
      onlineIdentity.token,
      onlineIdentity.user?.id,
    ]
  );

  return {
    roomState,
    socketError,
    isOnlineGame,
    isWaitingForAuthBootstrap,
    hasOnlineAccess,
    sessionToken: onlineIdentity.token,
    playerColor,
    currentUserId,
    opponentUserId,
    currentUserProfile,
    opponentProfile,
    currentUserName,
    opponentName,
    matchStake: match?.agreedStake ?? 0,
    matchGameMode: match?.gameMode || "",
    matchGameModeLabel: resolveMatchGameModeLabel(match?.gameMode || ""),
    matchGameCurrencyLabel: resolveMatchCurrencyLabel(match?.gameCurrency || ""),
    buildSocketOptions,
  };
}
