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
        if (cancelled) {
          return;
        }

        const client = createGameSocket({
          baseHttpUrl: API_BASE_URL,
          token: socketToken,
          gameId: resolvedGameId,
          userId: resolvedUserId,
          onOpen: () => {
            callbacksRef.current.onOpen?.();
          },
          onClose: (event) => {
            callbacksRef.current.onClose?.(event);
          },
          onJoined: (state) => {
            callbacksRef.current.onJoined?.(state);
          },
          onMove: ({ isOwnMessage, move }) => {
            if (isOwnMessage) {
              return;
            }
            callbacksRef.current.onRemoteMove?.(move);
          },
          onEmoji: (event) => {
            callbacksRef.current.onEmoji?.(event);
          },
          onGameEvent: (event) => {
            callbacksRef.current.onGameEvent?.(event);
          },
          onState: (state) => {
            callbacksRef.current.onStateChange?.(state);
          },
          onError: (error) => {
            callbacksRef.current.onError?.(error);
          },
        });

        socketRef.current = client;
      } catch (error) {
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
