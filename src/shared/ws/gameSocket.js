const WS_MESSAGE_TYPE = {
  JOIN: "game.join",
  JOINED: "game.joined",
  MOVE: "game.move",
  MOVE_ACCEPTED: "game.move.accepted",
  STATE: "game.state",
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

function parseUciMove(move) {
  const normalized = String(move || "").trim().toLowerCase();
  const match = normalized.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: match[3] || "q",
  };
}

function serializeUciMove({ from, to, promotion = "q" }) {
  const source = String(from || "").trim().toLowerCase();
  const target = String(to || "").trim().toLowerCase();

  if (!/^[a-h][1-8]$/.test(source) || !/^[a-h][1-8]$/.test(target)) {
    return "";
  }

  const shouldAddPromotion = /[18]$/.test(target);
  return `${source}${target}${shouldAddPromotion ? String(promotion || "q").toLowerCase() : ""}`;
}

export async function getDebugToken(baseHttpUrl, userId) {
  const response = await fetch(
    `${baseHttpUrl}/debug/token?user_id=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error(`Не удалось получить debug-токен: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.token) {
    throw new Error("Ответ /debug/token не содержит токен.");
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
  onState,
  onRawMessage,
}) {
  let knownMoveCount = 0;
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
      onError?.(new Error("Получен некорректный JSON из игрового сокета."));
      return;
    }

    onRawMessage?.(data);

    if (data.type === WS_MESSAGE_TYPE.JOINED) {
      const moveList = Array.isArray(data.payload?.moves) ? data.payload.moves : [];
      knownMoveCount = moveList.length;
      onJoined?.(data.payload);
      onState?.(data.payload);
      return;
    }

    if (data.type === WS_MESSAGE_TYPE.ERROR) {
      const message = data.error?.message || "Неизвестная ошибка игрового сокета.";
      onError?.(new Error(message));
      return;
    }

    if (data.type === WS_MESSAGE_TYPE.MOVE_ACCEPTED) {
      return;
    }

    if (data.type !== WS_MESSAGE_TYPE.STATE) {
      return;
    }

    const moveList = Array.isArray(data.payload?.moves) ? data.payload.moves : [];
    const nextMoveCount = moveList.length;
    const lastMoveEntry = moveList[nextMoveCount - 1];
    const parsedMove = parseUciMove(lastMoveEntry?.move || data.payload?.last_move);

    if (nextMoveCount > knownMoveCount && parsedMove) {
      const isOwnMessage =
        String(lastMoveEntry?.user_id || "") === String(userId || "");

      onMove?.({
        isOwnMessage,
        move: parsedMove,
        raw: data,
      });
    }

    knownMoveCount = nextMoveCount;
    onState?.(data.payload);
  };

  socket.onerror = () => {
    onError?.(new Error("Не удалось подключиться к игровой комнате."));
  };

  socket.onclose = (event) => {
    onClose?.(event);
  };

  return {
    sendMove(move) {
      if (socket.readyState !== WebSocket.OPEN) {
        return false;
      }

      const serializedMove = serializeUciMove(move);
      if (!serializedMove) {
        return false;
      }

      socket.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPE.MOVE,
          request_id: crypto.randomUUID(),
          payload: {
            game_id: gameId,
            move: serializedMove,
          },
        })
      );

      return true;
    },

    sendResign() {
      return false;
    },

    sendDraw() {
      return false;
    },

    close() {
      socket.close();
    },

    get readyState() {
      return socket.readyState;
    },
  };
}
