import { useEffect, useRef } from "react";
import {
  createGameSocket,
  getDebugToken,
} from "../../../shared/ws/gameSocket.js";
import { useAuth } from "../../auth/useAuth.js";
import { API_BASE_URL } from "../lib/boardConfig.js";
import { getGameParams } from "../lib/gameParams";

export function useGameSocket({
  onRemoteMove,
  onStateChange,
  onJoined,
  onOpen,
  onClose,
  onError,
  onEmoji,
  onGameEvent,
  enabled = true,
  gameId,
  userId,
  token: externalToken,
  allowDebugToken = false,
}) {
  const gameParams = getGameParams();
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const connectionAttemptRef = useRef(0);
  const callbacksRef = useRef({
    onRemoteMove,
    onStateChange,
    onJoined,
    onOpen,
    onClose,
    onError,
    onEmoji,
    onGameEvent,
  });

  const resolvedGameId = gameId ?? gameParams.gameId;
  const resolvedUserId = userId ?? user?.id ?? gameParams.userId;
  const resolvedToken = externalToken ?? token;

  useEffect(() => {
    callbacksRef.current = {
      onRemoteMove,
      onStateChange,
      onJoined,
      onOpen,
      onClose,
      onError,
      onEmoji,
      onGameEvent,
    };
  }, [
    onClose,
    onEmoji,
    onError,
    onGameEvent,
    onJoined,
    onOpen,
    onRemoteMove,
    onStateChange,
  ]);

  useEffect(() => {
    if (!enabled || !resolvedGameId || !resolvedUserId) {
      return undefined;
    }

    let cancelled = false;
    const attemptId = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = attemptId;

    function isCurrentAttempt() {
      return !cancelled && connectionAttemptRef.current === attemptId;
    }

    async function connect() {
      try {
        const socketToken =
          resolvedToken ||
          (allowDebugToken
            ? await getDebugToken(API_BASE_URL, resolvedUserId)
            : "");

        if (!socketToken) {
          throw new Error("Не найден токен для подключения к игре.");
        }
        if (!isCurrentAttempt()) {
          return;
        }

        const client = createGameSocket({
          baseHttpUrl: API_BASE_URL,
          token: socketToken,
          gameId: resolvedGameId,
          userId: resolvedUserId,
          onOpen: () => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onOpen?.();
          },
          onClose: (event) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onClose?.(event);
          },
          onJoined: (state) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onJoined?.(state);
          },
          onMove: ({ isOwnMessage, move }) => {
            if (!isCurrentAttempt()) {
              return;
            }
            if (isOwnMessage) {
              return;
            }
            callbacksRef.current.onRemoteMove?.(move);
          },
          onEmoji: (event) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onEmoji?.(event);
          },
          onGameEvent: (event) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onGameEvent?.(event);
          },
          onState: (state) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onStateChange?.(state);
          },
          onError: (error) => {
            if (!isCurrentAttempt()) {
              return;
            }
            callbacksRef.current.onError?.(error);
          },
        });

        if (!isCurrentAttempt()) {
          client.close();
          return;
        }

        socketRef.current = client;
      } catch (error) {
        if (!isCurrentAttempt()) {
          return;
        }
        callbacksRef.current.onError?.(
          error instanceof Error
            ? error
            : new Error("Не удалось подключиться к игровой комнате.")
        );
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (connectionAttemptRef.current === attemptId) {
        connectionAttemptRef.current += 1;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [
    allowDebugToken,
    enabled,
    resolvedGameId,
    resolvedToken,
    resolvedUserId,
  ]);

  function sendMove(move) {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendMove(move) ?? false;
  }

  function sendEmoji(emojiId) {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendEmoji(emojiId) ?? false;
  }

  function sendResign() {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendResign() ?? false;
  }

  function sendDrawOffer() {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendDrawOffer() ?? false;
  }

  function sendDrawAccept() {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendDrawAccept() ?? false;
  }

  function sendDrawDecline() {
    if (!enabled) {
      return false;
    }
    return socketRef.current?.sendDrawDecline() ?? false;
  }

  return {
    sendMove,
    sendEmoji,
    sendResign,
    sendDrawOffer,
    sendDrawAccept,
    sendDrawDecline,
  };
}
