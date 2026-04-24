const WS_MESSAGE_TYPE = {
  JOIN: "game.join",
  JOINED: "game.joined",
  MOVE: "game.move",
  MOVE_ACCEPTED: "game.move.accepted",
  STICKER: "game.sticker",
  STICKER_ACCEPTED: "game.sticker.accepted",
  MESSAGE: "game.message",
  EMOJI: "game.emoji",
  REACTION: "game.reaction",
  STATE: "game.state",
  ERROR: "error",
};

const EMOJI_SIGNAL_PATTERN = /(emoji|reaction|emote|sticker)/i;
const EMOJI_VARIANT_RETRY_MS = 240;
const EMOJI_SEEN_TTL_MS = 8_000;
const EMOJI_SEND_VARIANTS = [
  {
    type: WS_MESSAGE_TYPE.STICKER,
    buildPayload: (gameId, reaction, clientReactionId) => ({
      game_id: gameId,
      sticker_id: reaction.id,
      title: reaction.title,
      asset_url: reaction.assetUrl,
      media_type: reaction.mediaType,
      image_url: reaction.imageSrc,
      video_url: reaction.videoSrc,
      sound_url: reaction.soundSrc,
      client_reaction_id: clientReactionId,
    }),
  },
  {
    type: WS_MESSAGE_TYPE.EMOJI,
    buildPayload: (gameId, reaction, clientReactionId) => ({
      game_id: gameId,
      emoji_id: reaction.id,
      id: reaction.id,
      title: reaction.title,
      image_src: reaction.imageSrc,
      video_src: reaction.videoSrc,
      sound_src: reaction.soundSrc,
      client_reaction_id: clientReactionId,
    }),
  },
  {
    type: WS_MESSAGE_TYPE.REACTION,
    buildPayload: (gameId, reaction, clientReactionId) => ({
      game_id: gameId,
      reaction_id: reaction.id,
      id: reaction.id,
      title: reaction.title,
      image_src: reaction.imageSrc,
      video_src: reaction.videoSrc,
      sound_src: reaction.soundSrc,
      client_reaction_id: clientReactionId,
    }),
  },
  {
    type: WS_MESSAGE_TYPE.MESSAGE,
    buildPayload: (gameId, reaction, clientReactionId) => ({
      game_id: gameId,
      kind: "emoji",
      emoji_id: reaction.id,
      id: reaction.id,
      title: reaction.title,
      image_src: reaction.imageSrc,
      video_src: reaction.videoSrc,
      sound_src: reaction.soundSrc,
      client_reaction_id: clientReactionId,
    }),
  },
  {
    type: WS_MESSAGE_TYPE.MESSAGE,
    buildPayload: (gameId, reaction, clientReactionId) => ({
      game_id: gameId,
      message: JSON.stringify({
        kind: "emoji",
        emoji_id: reaction.id,
        id: reaction.id,
        title: reaction.title,
        image_src: reaction.imageSrc,
        video_src: reaction.videoSrc,
        sound_src: reaction.soundSrc,
        client_reaction_id: clientReactionId,
      }),
    }),
  },
];

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

function extractFirstString(candidate, keys) {
  if (!candidate || typeof candidate !== "object") {
    return "";
  }

  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function normalizeOutgoingEmoji(reaction) {
  if (!reaction) {
    return null;
  }

  if (typeof reaction === "string") {
    return {
      id: reaction,
      title: "",
      imageSrc: "",
      videoSrc: "",
      soundSrc: "",
    };
  }

  const id =
    extractFirstString(reaction, [
      "id",
      "emoji_id",
      "emojiId",
      "reaction_id",
      "reactionId",
      "emote_id",
      "emoteId",
    ]) || "";

  if (!id) {
    return null;
  }

  const normalizedReaction = {
    id,
    title: extractFirstString(reaction, ["title", "name", "label"]),
    assetUrl: extractFirstString(reaction, [
      "assetUrl",
      "asset_url",
      "videoSrc",
      "video_src",
      "imageSrc",
      "image_src",
      "gifSrc",
      "gif_src",
    ]),
    mediaType: extractFirstString(reaction, ["mediaType", "media_type"]),
    imageSrc: extractFirstString(reaction, [
      "imageSrc",
      "image_src",
      "gifSrc",
      "gif_src",
      "image",
      "gif",
    ]),
    videoSrc: extractFirstString(reaction, [
      "videoSrc",
      "video_src",
      "previewSrc",
      "preview_src",
      "video",
    ]),
    soundSrc: extractFirstString(reaction, [
      "soundSrc",
      "sound_src",
      "audioSrc",
      "audio_src",
      "mp3Src",
      "mp3_src",
      "sound",
      "audio",
      "mp3",
    ]),
  };

  if (!normalizedReaction.mediaType) {
    normalizedReaction.mediaType = normalizedReaction.videoSrc
      ? "video"
      : normalizedReaction.imageSrc
      ? "image"
      : "";
  }

  if (!normalizedReaction.assetUrl) {
    normalizedReaction.assetUrl =
      normalizedReaction.videoSrc || normalizedReaction.imageSrc || "";
  }

  return normalizedReaction;
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
    promotion: match[3] ? match[3].toLowerCase() : undefined,
  };
}

function serializeUciMove({ from, to, promotion }) {
  const source = String(from || "").trim().toLowerCase();
  const target = String(to || "").trim().toLowerCase();
  const normalizedPromotion =
    typeof promotion === "string" && /^[qrbn]$/i.test(promotion.trim())
      ? promotion.trim().toLowerCase()
      : "";

  if (!/^[a-h][1-8]$/.test(source) || !/^[a-h][1-8]$/.test(target)) {
    return "";
  }

  return `${source}${target}${normalizedPromotion}`;
}

function normalizeEmojiEvent(data, currentUserId) {
  const type = String(data?.type || "");
  const payload = data?.payload || {};
  const requestId = String(data?.request_id || payload?.request_id || "");
  const body =
    typeof payload.message === "string"
      ? safeJsonParse(payload.message)
      : payload.message;
  const dataBody = data?.data && typeof data.data === "object" ? data.data : null;
  const candidates = [
    data,
    payload,
    payload?.data,
    payload?.event,
    payload?.emoji,
    payload?.reaction,
    body,
    body?.data,
    body?.event,
    body?.emoji,
    body?.reaction,
    dataBody,
  ].filter(Boolean);

  const hasEmojiSignal =
    EMOJI_SIGNAL_PATTERN.test(type) ||
    candidates.some((candidate) => {
      const kind = String(
        candidate?.kind || candidate?.type || candidate?.event || candidate?.message_type || ""
      );
      return EMOJI_SIGNAL_PATTERN.test(kind);
    });

  if (!hasEmojiSignal && type !== WS_MESSAGE_TYPE.MESSAGE) {
    return null;
  }

  const emojiId = candidates.reduce((foundValue, candidate) => {
    if (foundValue) {
      return foundValue;
    }

    return extractFirstString(candidate, [
      "emoji_id",
      "emojiId",
      "reaction_id",
      "reactionId",
      "emote_id",
      "emoteId",
      "sticker_id",
      "stickerId",
      "item_id",
      "itemId",
      "id",
    ]);
  }, "");
  const mediaType = candidates.reduce(
    (foundValue, candidate) =>
      foundValue || extractFirstString(candidate, ["media_type", "mediaType"]),
    ""
  );
  const assetUrl = candidates.reduce(
    (foundValue, candidate) =>
      foundValue || extractFirstString(candidate, ["asset_url", "assetUrl"]),
    ""
  );
  const resolvedEmojiId =
    emojiId || (EMOJI_SIGNAL_PATTERN.test(type) && assetUrl ? `sticker:${assetUrl}` : "");

  if (!resolvedEmojiId) {
    return null;
  }

  const senderUserId = candidates.reduce((foundValue, candidate) => {
    if (foundValue) {
      return foundValue;
    }

    return extractFirstString(candidate, [
      "user_id",
      "userId",
      "by_user_id",
      "sender_user_id",
      "senderUserId",
      "player_id",
      "playerId",
    ]);
  }, "");
  const clientReactionId = candidates.reduce((foundValue, candidate) => {
    if (foundValue) {
      return foundValue;
    }

    return extractFirstString(candidate, [
      "client_reaction_id",
      "clientReactionId",
      "emoji_client_id",
      "emojiClientId",
      "nonce",
    ]);
  }, "");
  const reaction = {
    id: String(resolvedEmojiId),
    title:
      candidates.reduce(
        (foundValue, candidate) =>
          foundValue || extractFirstString(candidate, ["title", "name", "label"]),
        ""
      ) || String(resolvedEmojiId),
    imageSrc: candidates.reduce(
      (foundValue, candidate) =>
        foundValue ||
        extractFirstString(candidate, [
          "image_src",
          "imageSrc",
          "image_url",
          "imageUrl",
          "gif_src",
          "gifSrc",
          "image",
          "gif",
        ]),
      ""
    ),
    videoSrc: candidates.reduce(
      (foundValue, candidate) =>
        foundValue ||
        extractFirstString(candidate, [
          "video_src",
          "videoSrc",
          "video_url",
          "videoUrl",
          "preview_src",
          "previewSrc",
          "video",
        ]),
      ""
    ),
    soundSrc: candidates.reduce(
      (foundValue, candidate) =>
        foundValue ||
        extractFirstString(candidate, [
          "sound_src",
          "soundSrc",
          "sound_url",
          "soundUrl",
          "audio_src",
          "audioSrc",
          "mp3_src",
          "mp3Src",
          "sound",
          "audio",
          "mp3",
        ]),
      ""
    ),
  };

  if (!reaction.videoSrc && (mediaType === "video" || mediaType === "mp4")) {
    reaction.videoSrc = assetUrl;
  }

  if (
    !reaction.imageSrc &&
    (mediaType === "image" || mediaType === "gif" || mediaType === "sticker")
  ) {
    reaction.imageSrc = assetUrl;
  }

  reaction.assetUrl = assetUrl || reaction.videoSrc || reaction.imageSrc;
  reaction.mediaType =
    mediaType ||
    (reaction.videoSrc ? "video" : reaction.imageSrc ? "image" : "");

  return {
    emojiId: String(resolvedEmojiId),
    senderUserId,
    requestId,
    clientReactionId,
    reaction,
    isOwnMessage:
      Boolean(senderUserId) && String(senderUserId) === String(currentUserId),
    raw: data,
  };
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
  onEmoji,
  onState,
  onRawMessage,
}) {
  let knownMoveCount = 0;
  const pendingEmojiRequestIds = new Map();
  const pendingEmojiEvents = new Map();
  const emojiCleanupTimers = new Map();
  const emojiRetryTimers = new Map();
  const seenEmojiEventIds = new Map();
  const socket = new WebSocket(buildWsUrl(baseHttpUrl, token));

  function clearSeenEmojiEvent(eventId) {
    if (!eventId) {
      return;
    }

    if (seenEmojiEventIds.has(eventId)) {
      window.clearTimeout(seenEmojiEventIds.get(eventId));
      seenEmojiEventIds.delete(eventId);
    }
  }

  function markSeenEmojiEvent(eventId) {
    if (!eventId) {
      return;
    }

    clearSeenEmojiEvent(eventId);
    const cleanupTimer = window.setTimeout(() => {
      seenEmojiEventIds.delete(eventId);
    }, EMOJI_SEEN_TTL_MS);

    seenEmojiEventIds.set(eventId, cleanupTimer);
  }

  function clearPendingEmojiRequestById(requestId) {
    if (!requestId) {
      return;
    }

    pendingEmojiRequestIds.delete(requestId);

    if (emojiCleanupTimers.has(requestId)) {
      window.clearTimeout(emojiCleanupTimers.get(requestId));
      emojiCleanupTimers.delete(requestId);
    }
  }

  function stopPendingEmojiEvent(clientReactionId) {
    if (!clientReactionId) {
      return;
    }

    const pendingEvent = pendingEmojiEvents.get(clientReactionId);
    if (!pendingEvent) {
      return;
    }

    pendingEmojiEvents.delete(clientReactionId);

    if (emojiRetryTimers.has(clientReactionId)) {
      window.clearTimeout(emojiRetryTimers.get(clientReactionId));
      emojiRetryTimers.delete(clientReactionId);
    }

    for (const requestId of pendingEvent.requestIds) {
      clearPendingEmojiRequestById(requestId);
    }
  }

  function sendEmojiVariant(clientReactionId) {
    const pendingEvent = pendingEmojiEvents.get(clientReactionId);
    if (!pendingEvent) {
      return false;
    }

    const variant = EMOJI_SEND_VARIANTS[pendingEvent.variantIndex];
    const normalizedReaction = pendingEvent.reaction;

    if (!variant || socket.readyState !== WebSocket.OPEN || !normalizedReaction) {
      return false;
    }

    const requestId = crypto.randomUUID();
    pendingEvent.requestIds.add(requestId);
    pendingEmojiRequestIds.set(requestId, clientReactionId);

    const cleanupTimer = window.setTimeout(() => {
      clearPendingEmojiRequestById(requestId);
    }, 15_000);

    emojiCleanupTimers.set(requestId, cleanupTimer);

    socket.send(
      JSON.stringify({
        type: variant.type,
        request_id: requestId,
        payload: variant.buildPayload(gameId, normalizedReaction, clientReactionId),
      })
    );

    console.log("[emoji] sending ws message", {
      type: variant.type,
      requestId,
      clientReactionId,
      payload: variant.buildPayload(gameId, normalizedReaction, clientReactionId),
    });

    if (emojiRetryTimers.has(clientReactionId)) {
      window.clearTimeout(emojiRetryTimers.get(clientReactionId));
      emojiRetryTimers.delete(clientReactionId);
    }

    if (pendingEvent.variantIndex < EMOJI_SEND_VARIANTS.length - 1) {
      const retryTimer = window.setTimeout(() => {
        const currentPendingEvent = pendingEmojiEvents.get(clientReactionId);
        if (!currentPendingEvent) {
          return;
        }

        currentPendingEvent.variantIndex += 1;
        sendEmojiVariant(clientReactionId);
      }, EMOJI_VARIANT_RETRY_MS);

      emojiRetryTimers.set(clientReactionId, retryTimer);
    }

    return true;
  }

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

    if (EMOJI_SIGNAL_PATTERN.test(String(data?.type || ""))) {
      console.log("[emoji] raw incoming ws message", data);
    }

    const emojiEvent = normalizeEmojiEvent(data, userId);
    if (emojiEvent) {
      console.log("[emoji] normalized incoming event", emojiEvent);
      const eventKey = emojiEvent.clientReactionId || emojiEvent.requestId;

      if (eventKey && seenEmojiEventIds.has(eventKey)) {
        return;
      }

      if (
        emojiEvent.clientReactionId &&
        pendingEmojiEvents.has(emojiEvent.clientReactionId)
      ) {
        stopPendingEmojiEvent(emojiEvent.clientReactionId);
        markSeenEmojiEvent(emojiEvent.clientReactionId);

        onEmoji?.({
          ...emojiEvent,
          isOwnMessage: true,
        });
        return;
      }

      if (emojiEvent.requestId && pendingEmojiRequestIds.has(emojiEvent.requestId)) {
        const clientReactionId = pendingEmojiRequestIds.get(emojiEvent.requestId);
        clearPendingEmojiRequestById(emojiEvent.requestId);
        stopPendingEmojiEvent(clientReactionId);
        markSeenEmojiEvent(clientReactionId || emojiEvent.requestId);

        onEmoji?.({
          ...emojiEvent,
          isOwnMessage: true,
        });
        return;
      }

      if (eventKey) {
        markSeenEmojiEvent(eventKey);
      }
      onEmoji?.(emojiEvent);
      return;
    }

    if (data.type === WS_MESSAGE_TYPE.JOINED) {
      const moveList = Array.isArray(data.payload?.moves) ? data.payload.moves : [];
      knownMoveCount = moveList.length;
      onJoined?.(data.payload);
      onState?.(data.payload);
      return;
    }

    if (data.type === WS_MESSAGE_TYPE.ERROR) {
      const pendingEmojiClientReactionId = data.request_id
        ? pendingEmojiRequestIds.get(data.request_id)
        : "";
      const pendingEmojiEvent = pendingEmojiClientReactionId
        ? pendingEmojiEvents.get(pendingEmojiClientReactionId)
        : null;
      const isIgnoredEmojiError =
        Boolean(pendingEmojiEvent) &&
        String(data.error?.code || "") === "UNKNOWN_TYPE";

      if (data.request_id) {
        clearPendingEmojiRequestById(data.request_id);

        if (pendingEmojiEvent) {
          if (pendingEmojiEvent.variantIndex < EMOJI_SEND_VARIANTS.length - 1) {
            pendingEmojiEvent.variantIndex += 1;
            sendEmojiVariant(pendingEmojiClientReactionId);
          } else {
            stopPendingEmojiEvent(pendingEmojiClientReactionId);
          }
        }
      }

      if (isIgnoredEmojiError) {
        return;
      }

      const message = data.error?.message || "Неизвестная ошибка игрового сокета.";
      onError?.(new Error(message));
      return;
    }

    if (
      data.type === WS_MESSAGE_TYPE.MOVE_ACCEPTED ||
      data.type === WS_MESSAGE_TYPE.STICKER_ACCEPTED
    ) {
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

    sendEmoji(emojiId) {
      const normalizedReaction = normalizeOutgoingEmoji(emojiId);
      if (!normalizedReaction) {
        return false;
      }

      const clientReactionId = crypto.randomUUID();
      stopPendingEmojiEvent(clientReactionId);
      pendingEmojiEvents.set(clientReactionId, {
        reaction: normalizedReaction,
        variantIndex: 0,
        requestIds: new Set(),
      });

      return sendEmojiVariant(clientReactionId);
    },

    sendResign() {
      return false;
    },

    sendDraw() {
      return false;
    },

    close() {
      for (const cleanupTimer of emojiCleanupTimers.values()) {
        window.clearTimeout(cleanupTimer);
      }

      for (const retryTimer of emojiRetryTimers.values()) {
        window.clearTimeout(retryTimer);
      }

      for (const seenTimer of seenEmojiEventIds.values()) {
        window.clearTimeout(seenTimer);
      }

      emojiCleanupTimers.clear();
      emojiRetryTimers.clear();
      seenEmojiEventIds.clear();
      pendingEmojiRequestIds.clear();
      pendingEmojiEvents.clear();
      socket.close();
    },

    get readyState() {
      return socket.readyState;
    },
  };
}
