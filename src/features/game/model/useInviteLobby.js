import { useCallback, useEffect, useRef, useState } from "react";
import { createFriendInvite } from "../inviteApi.js";
import { getGameParticipants } from "../gameApi.js";
import { API_BASE_URL } from "../../../shared/config/api.js";
import { createGameSocket } from "../../../shared/ws/gameSocket.js";

const LOBBY_POLL_INTERVAL_MS = 1500;

const LOBBY_STATUS = {
  preparing: "\u041f\u043e\u0434\u0433\u043e\u0442\u0430\u0432\u043b\u0438\u0432\u0430\u0435\u043c \u043b\u043e\u0431\u0431\u0438...",
  waiting:
    "\u0416\u0434\u0435\u043c, \u043f\u043e\u043a\u0430 \u0434\u0440\u0443\u0433 \u043e\u0442\u043a\u0440\u043e\u0435\u0442 \u0441\u0441\u044b\u043b\u043a\u0443-\u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435 \u0438 \u0432\u043e\u0439\u0434\u0435\u0442 \u0432 \u043a\u043e\u043c\u043d\u0430\u0442\u0443.",
  connecting:
    "\u0414\u0440\u0443\u0433 \u0432\u043e\u0448\u0435\u043b \u0432 \u043a\u043e\u043c\u043d\u0430\u0442\u0443. \u041c\u043e\u0436\u043d\u043e \u0432\u0445\u043e\u0434\u0438\u0442\u044c \u0432 \u043b\u043e\u0431\u0431\u0438.",
  ready:
    "\u0414\u0440\u0443\u0433 \u043f\u0440\u0438\u043d\u044f\u043b \u0432\u044b\u0437\u043e\u0432. \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u00ab\u0412\u043e\u0439\u0442\u0438 \u0432 \u043b\u043e\u0431\u0431\u0438\u00bb, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u0443.",
};

function buildReadyLobbyState(current, gameId) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    gameId: gameId || current.gameId,
    roomStatus: "active",
    connectionError: "",
    readyToEnter: true,
    statusMessage: LOBBY_STATUS.ready,
  };
}

export function useInviteLobby({
  token,
  userId,
  isAuthenticated,
  isInitializing,
  onAuthRequired,
  onGameReady,
}) {
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLobby, setInviteLobby] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const waitingSocketRef = useRef(null);
  const autoEnterHandledGameIdRef = useRef("");

  const closeInviteSocket = useCallback(() => {
    waitingSocketRef.current?.close();
    waitingSocketRef.current = null;
  }, []);

  const clearInviteLobby = useCallback(() => {
    closeInviteSocket();
    autoEnterHandledGameIdRef.current = "";
    setInviteLobby(null);
    setIsInviteModalOpen(false);
  }, [closeInviteSocket]);

  const hideInviteModal = useCallback(() => {
    setIsInviteModalOpen(false);
  }, []);

  const markInviteReady = useCallback(
    (gameId) => {
      closeInviteSocket();
      setInviteLobby((current) => buildReadyLobbyState(current, gameId));
      setIsInviteModalOpen(true);
    },
    [closeInviteSocket]
  );

  const enterLobby = useCallback(() => {
    const gameId = String(inviteLobby?.gameId || "").trim();
    if (!gameId) {
      return;
    }

    autoEnterHandledGameIdRef.current = gameId;
    closeInviteSocket();
    setIsInviteModalOpen(false);
    onGameReady?.(gameId);
  }, [closeInviteSocket, inviteLobby?.gameId, onGameReady]);

  useEffect(() => clearInviteLobby, [clearInviteLobby]);

  useEffect(() => {
    if (!inviteLobby?.readyToEnter || !inviteLobby?.gameId) {
      return undefined;
    }

    const gameId = String(inviteLobby.gameId).trim();
    if (!gameId || autoEnterHandledGameIdRef.current === gameId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (autoEnterHandledGameIdRef.current === gameId) {
        return;
      }

      autoEnterHandledGameIdRef.current = gameId;
      closeInviteSocket();
      setIsInviteModalOpen(false);
      onGameReady?.(gameId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    closeInviteSocket,
    inviteLobby?.gameId,
    inviteLobby?.readyToEnter,
    onGameReady,
  ]);

  useEffect(() => {
    if (!inviteLobby?.expiresAt) {
      return undefined;
    }

    const deadline = new Date(inviteLobby.expiresAt).getTime();
    if (Number.isNaN(deadline)) {
      return undefined;
    }

    const timeoutMs = deadline - Date.now();
    if (timeoutMs <= 0) {
      setInviteLobby((current) =>
        current ? { ...current, expired: true } : current
      );
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setInviteLobby((current) =>
        current ? { ...current, expired: true } : current
      );
    }, timeoutMs);

    return () => window.clearTimeout(timerId);
  }, [inviteLobby?.expiresAt]);

  useEffect(() => {
    if (!inviteLobby?.gameId || !token || !userId || inviteLobby.readyToEnter) {
      return undefined;
    }

    const client = createGameSocket({
      baseHttpUrl: API_BASE_URL,
      token,
      gameId: inviteLobby.gameId,
      userId,
      onOpen: () => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                connectionError: "",
                statusMessage: LOBBY_STATUS.waiting,
              }
            : current
        );
      },
      onJoined: (state) => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                roomStatus: state?.status || current.roomStatus,
              }
            : current
        );
      },
      onState: (state) => {
        const hasSecondPlayer = Boolean(state?.player2_id);

        setInviteLobby((current) =>
          current
            ? {
                ...current,
                roomStatus: state?.status || current.roomStatus,
                connectionError: "",
                statusMessage: hasSecondPlayer
                  ? state?.status === "active"
                    ? LOBBY_STATUS.ready
                    : LOBBY_STATUS.connecting
                  : LOBBY_STATUS.waiting,
                readyToEnter:
                  current.readyToEnter ||
                  Boolean(hasSecondPlayer && state?.status === "active"),
              }
            : current
        );

        if (hasSecondPlayer && state?.status === "active") {
          markInviteReady(state.game_id || inviteLobby.gameId);
        }
      },
      onError: (error) => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                connectionError:
                  error?.message ||
                  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u0435 \u0441 \u043b\u043e\u0431\u0431\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u0441\u0441\u044b\u043b\u043a\u0443.",
              }
            : current
        );
      },
      onClose: () => {
        if (waitingSocketRef.current === client) {
          waitingSocketRef.current = null;
        }
      },
    });

    waitingSocketRef.current = client;

    return () => {
      if (waitingSocketRef.current === client) {
        waitingSocketRef.current = null;
      }
      client.close();
    };
  }, [
    inviteLobby?.gameId,
    inviteLobby?.readyToEnter,
    markInviteReady,
    token,
    userId,
  ]);

  useEffect(() => {
    if (!inviteLobby?.gameId || !token || !userId || inviteLobby.readyToEnter) {
      return undefined;
    }

    let cancelled = false;

    async function syncInviteParticipants() {
      try {
        const response = await getGameParticipants(inviteLobby.gameId, token);
        if (cancelled) {
          return;
        }

        const secondPlayerId = String(response?.player2?.id || "").trim();
        const hasSecondPlayer =
          Boolean(secondPlayerId) && secondPlayerId !== String(userId);

        if (hasSecondPlayer) {
          markInviteReady(inviteLobby.gameId);
        }
      } catch {
        // Keep websocket as the primary channel and quietly retry polling.
      }
    }

    syncInviteParticipants();

    const intervalId = window.setInterval(
      syncInviteParticipants,
      LOBBY_POLL_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    inviteLobby?.gameId,
    inviteLobby?.readyToEnter,
    markInviteReady,
    token,
    userId,
  ]);

  const createInvite = useCallback(
    async ({ gameMode = "classic", timeControlId = "unlimited" } = {}) => {
      if (isInitializing) {
        return null;
      }

    if (!isAuthenticated) {
      onAuthRequired?.();
      return null;
    }

    setIsCreatingInvite(true);
    setInviteError("");
    clearInviteLobby();
    autoEnterHandledGameIdRef.current = "";

    try {
      const response = await createFriendInvite(token, gameMode, timeControlId);
      setInviteLobby({
        gameId: response.gameId,
        gameMode: response.gameMode || gameMode,
        timeControlId: response.timeControlId || timeControlId,
        timeControlLabel: response.timeControlLabel || "",
        timeControlBaseMs: Number(response.timeControlBaseMs ?? 0),
        timeControlIncrementMs: Number(response.timeControlIncrementMs ?? 0),
        inviteToken: response.inviteToken,
        inviteUrl: response.inviteUrl,
        expiresAt: response.expiresAt,
        copied: false,
        expired: false,
        roomStatus: response.status,
        readyToEnter: false,
        statusMessage: LOBBY_STATUS.preparing,
        connectionError: "",
      });
      setIsInviteModalOpen(true);
      return response;
    } catch (error) {
      setInviteError(
        error.message ||
          "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443-\u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435."
      );
      setIsInviteModalOpen(false);
      return null;
    } finally {
      setIsCreatingInvite(false);
    }
    },
    [clearInviteLobby, isAuthenticated, isInitializing, onAuthRequired, token]
  );

  const copyInvite = useCallback(async () => {
    if (!inviteLobby?.inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLobby.inviteUrl);
      setInviteLobby((current) =>
        current ? { ...current, copied: true } : current
      );
    } catch {
      setInviteLobby((current) =>
        current
          ? {
              ...current,
              connectionError:
                "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438. \u0421\u043a\u043e\u043f\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0435 \u0432\u0440\u0443\u0447\u043d\u0443\u044e.",
            }
          : current
      );
    }
  }, [inviteLobby?.inviteUrl]);

  return {
    isCreatingInvite,
    inviteError,
    inviteLobby,
    isInviteModalOpen,
    createInvite,
    copyInvite,
    clearInviteLobby,
    hideInviteModal,
    enterLobby,
  };
}
