import { useEffect, useRef } from "react";
import { createGameSocket, getDebugToken } from "../../../shared/ws/gameSocket.js";
import { API_BASE_URL } from "../lib/boardConfig";
import { getGameParams } from "../lib/gameParams";

export function useGameSocket({ onRemoteMove }) {
  const { gameId, userId } = getGameParams();
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const token = await getDebugToken(API_BASE_URL, userId);
        if (cancelled) return;

        const client = createGameSocket({
          baseHttpUrl: API_BASE_URL,
          token,
          gameId,
          userId,

          onOpen: () => {
          },

          onClose: () => {
          },

          onJoined: (payload) => {
          },

          onMove: ({ isOwnMessage, move }) => {
            if (isOwnMessage) return;
            onRemoteMove?.(move);
          },

          onError: (error) => {
            console.error("WS error:", error);
          },
        });

        socketRef.current = client;
      } catch (error) {
        console.error("Failed to connect WS:", error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [gameId, userId, onRemoteMove]);

  function sendMove(move) {
    socketRef.current?.sendMove(move);
  }

  return {
    sendMove,
  };
}