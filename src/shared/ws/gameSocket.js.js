const WS_MESSAGE_TYPE = {
  JOIN: "game.join",
  JOINED: "game.joined",
  MESSAGE: "game.message",
  ERROR: "error",
};

function buildWsUrl(baseHttpUrl, token) {
  return `${baseHttpUrl.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function getDebugToken(baseHttpUrl, userId) {
  const response = await fetch(
    `${baseHttpUrl}/debug/token?user_id=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.token) {
    throw new Error("Token is missing in /debug/token response");
  }

  return data.token;
}

export function createGameSocket({
  baseHttpUrl,
  token,
  gameId,
  userId,
  onOpen,
  onClose,
  onError,
  onJoined,
  onMove,
  onRawMessage,
}) {
  const socket = new WebSocket(buildWsUrl(baseHttpUrl, token));

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: WS_MESSAGE_TYPE.JOIN,
        request_id: crypto.randomUUID(),
        payload: {
          game_id: gameId,
        },
      })
    );

    onOpen?.();
  };

  socket.onmessage = (event) => {
    const data = safeJsonParse(event.data);

    if (!data) {
      onError?.(new Error("Invalid WS JSON"));
      return;
    }

    onRawMessage?.(data);

    if (data.type === WS_MESSAGE_TYPE.JOINED) {
      onJoined?.(data.payload);
      return;
    }

    if (data.type === WS_MESSAGE_TYPE.ERROR) {
      onError?.(data.error || new Error("Unknown WS error"));
      return;
    }

    if (data.type !== WS_MESSAGE_TYPE.MESSAGE) {
      return;
    }

    const payload = data.payload || {};
    const messageBody = safeJsonParse(payload.message);

    if (!messageBody) return;
    if (messageBody.kind !== "move") return;

    const isOwnMessage = String(payload.user_id) === String(userId);

    onMove?.({
      gameId: payload.game_id,
      senderUserId: payload.user_id,
      isOwnMessage,
      move: {
        from: messageBody.from,
        to: messageBody.to,
        promotion: messageBody.promotion || "q",
      },
      raw: data,
    });
  };

  socket.onerror = (event) => {
    onError?.(event);
  };

  socket.onclose = (event) => {
    onClose?.(event);
  };

  return {
    sendMove({ from, to, promotion = "q" }) {
      if (socket.readyState !== WebSocket.OPEN) return false;

      socket.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPE.MESSAGE,
          request_id: crypto.randomUUID(),
          payload: {
            game_id: gameId,
            message: JSON.stringify({
              kind: "move",
              from,
              to,
              promotion,
            }),
          },
        })
      );

      return true;
    },

    sendMessage(message) {
      if (socket.readyState !== WebSocket.OPEN) return false;

      socket.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPE.MESSAGE,
          request_id: crypto.randomUUID(),
          payload: {
            game_id: gameId,
            message:
              typeof message === "string" ? message : JSON.stringify(message),
          },
        })
      );

      return true;
    },

    close() {
      socket.close();
    },

    get readyState() {
      return socket.readyState;
    },
  };
}