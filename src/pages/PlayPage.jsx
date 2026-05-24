import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../shared/ui/atoms/Button.jsx";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ChessBoardSection from "../features/chess/ui/ChessBoardSection.jsx";
import GameSettingsPanel from "../features/game/ui/GameSettingsPanel.jsx";
import { useChessGame } from "../features/chess/hooks/useChessGame.js";
import { useGameSocket } from "../features/chess/hooks/useGameSocket.js";
import { DEFAULT_AVATAR } from "../features/chess/lib/boardConfig.js";
import { useOnlineGameRoom } from "../features/game/model/useOnlineGameRoom.js";
import { useLocalBotGameRoom } from "../features/game/model/useLocalBotGameRoom.js";
import { useGameClock } from "../features/game/model/useGameClock.js";
import { useAuth } from "../features/auth/useAuth.js";
import {
  readStoredEmojiQuickAccess,
  resolveEmojiQuickAccessItems,
  resolveEmojiReactionById,
  subscribeEmojiQuickAccessChanges,
} from "../shared/lib/emojiQuickAccess.js";
import { withAssetBase } from "../shared/lib/assets.js";
import { useResponsiveWorkspaceLayout } from "../features/chess/hooks/useResponsiveWorkspaceLayout.js";
import { useNotifications } from "../features/notifications/useNotifications.js";
import GameResultModal from "../components/organisms/GameResultModal.jsx";
import { useReliableNavigate } from "../shared/router/useReliableNavigate.js";
import {
  persistMemeEffectsVolume,
  readStoredMemeEffectsVolume,
  subscribeMemeEffectsVolumeChanges,
} from "../shared/lib/memeEffectsVolume.js";
import {
  persistEmojiVolume,
  readStoredEmojiVolume,
  subscribeEmojiVolumeChanges,
} from "../shared/lib/emojiVolume.js";
import {
  DEFAULT_PIECE_SKIN_SLUG,
  normalizePieceSkinSlug,
} from "../shared/constants/customizationCatalog.js";
import { readStoredPieceSkin } from "../shared/lib/pieceSkin.js";

const EMOJI_COOLDOWN_MS = 10_000;
const EMOJI_POPUP_DURATION_MS = 2_400;
const reactionDurationCache = new Map();
const EVOLUTION_STAGE_NOTICES = [
  {
    threshold: 5,
    title: "Эволюция: пешки",
    message:
      "После 10-го хода пешки получили контратаку: при взятии пешкой атакующая пешка может быть съедена в ответ.",
  },
  {
    threshold: 7,
    title: "Эволюция: король",
    message:
      "После 14-го хода король получает одноразовую защиту от одиночного мата и удаляет фигуру, поставившую мат.",
  },
  {
    threshold: 10,
    title: "Эволюция: коня",
    message:
      "После 20-го хода кони могут ходить дважды за один ход.",
  },
  {
    threshold: 15,
    title: "Эволюция: прорыв слона",
    message:
      "После 30-го хода слона пробивает пешки насквозь и может поражать фигуры за ними.",
  },
];

EVOLUTION_STAGE_NOTICES[0] = {
  threshold: 5,
  title: "Эволюция: пешки",
  message:
    "После 5-го хода пешки получают контратаку: при взятии атакующая пешка может быть съедена в ответ с вероятностью 50%.",
};

EVOLUTION_STAGE_NOTICES[1] = {
  threshold: 7,
  title: "Эволюция: король",
  message:
    "После 7-го хода король переживает одиночный мат и удаляет фигуру, которая его поставила. Против двойного шаха это не работает.",
};

EVOLUTION_STAGE_NOTICES[2] = {
  threshold: 10,
  title: "Эволюция: коня",
  message:
    "После 10-го хода кони могут ходить дважды за один ход.",
};

EVOLUTION_STAGE_NOTICES[3] = {
  threshold: 15,
  title: "Эволюция: слона",
  message:
    "После 15-го хода слоны пробивают пешки насквозь и могут поражать фигуры за ними.",
};

EVOLUTION_STAGE_NOTICES.push({
  threshold: 20,
  title: "Эволюция: ладьи",
  message:
    "После 20-го хода ладья сносит все фигуры на своем пути и превращает линии в зону тотального урона.",
});

function resolveReactionDurationMs(reaction) {
  const mediaSrc = reaction?.videoSrc || reaction?.soundSrc || "";

  if (!mediaSrc || typeof document === "undefined") {
    return Promise.resolve(EMOJI_POPUP_DURATION_MS);
  }

  const cachedDuration = reactionDurationCache.get(mediaSrc);
  if (cachedDuration) {
    return cachedDuration;
  }

  const durationPromise = new Promise((resolve) => {
    const mediaElement = document.createElement("video");

    function cleanup() {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("error", handleError);
      mediaElement.src = "";
    }

    function handleLoadedMetadata() {
      const durationSeconds = Number.isFinite(mediaElement.duration)
        ? mediaElement.duration
        : 0;
      const durationMs =
        durationSeconds > 0
          ? Math.max(400, Math.round(durationSeconds * 1000))
          : EMOJI_POPUP_DURATION_MS;

      cleanup();
      resolve(durationMs);
    }

    function handleError() {
      cleanup();
      resolve(EMOJI_POPUP_DURATION_MS);
    }

    mediaElement.preload = "metadata";
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("error", handleError);
    mediaElement.src = mediaSrc;
  });

  reactionDurationCache.set(mediaSrc, durationPromise);
  return durationPromise;
}

function createReactionFromItem(item) {
  if (!item?.id) {
    return null;
  }

  return {
    id: item.id,
    title: item.title || String(item.id),
    assetUrl: item.videoSrc || item.imageSrc || "",
    mediaType: item.videoSrc ? "video" : item.imageSrc ? "image" : "",
    imageSrc: item.imageSrc || withAssetBase("/images/default-emoji.png"),
    videoSrc: item.videoSrc || "",
    soundSrc: item.videoSrc || "",
  };
}

function normalizeReactionInput(reactionInput) {
  if (!reactionInput) {
    return null;
  }

  if (typeof reactionInput === "string") {
    const resolvedReaction = resolveEmojiReactionById(reactionInput);
    if (!resolvedReaction) {
      return null;
    }

    return {
      ...resolvedReaction,
      assetUrl: resolvedReaction.videoSrc || resolvedReaction.imageSrc || "",
      mediaType: resolvedReaction.videoSrc ? "video" : "image",
      videoSrc: resolvedReaction.videoSrc || "",
      soundSrc: resolvedReaction.videoSrc || "",
    };
  }

  const reactionId =
    reactionInput.id || reactionInput.emojiId || reactionInput.emoji_id || "";
  const resolvedReaction = reactionId ? resolveEmojiReactionById(reactionId) : null;
  const imageSrc =
    reactionInput.imageSrc ||
    reactionInput.image_src ||
    reactionInput.imageUrl ||
    reactionInput.image_url ||
    resolvedReaction?.imageSrc ||
    withAssetBase("/images/default-emoji.png");
  const videoSrc =
    reactionInput.videoSrc ||
    reactionInput.video_src ||
    reactionInput.videoUrl ||
    reactionInput.video_url ||
    "";
  const soundSrc =
    reactionInput.soundSrc ||
    reactionInput.sound_src ||
    reactionInput.soundUrl ||
    reactionInput.sound_url ||
    videoSrc ||
    resolvedReaction?.videoSrc ||
    "";

  return {
    id: reactionId || resolvedReaction?.id || "",
    title: reactionInput.title || resolvedReaction?.title || "Эмодзи",
    assetUrl:
      reactionInput.assetUrl ||
      reactionInput.asset_url ||
      videoSrc ||
      imageSrc ||
      "",
    mediaType:
      reactionInput.mediaType ||
      reactionInput.media_type ||
      (videoSrc ? "video" : imageSrc ? "image" : ""),
    imageSrc,
    videoSrc,
    soundSrc,
  };
}

function findKingSquareByColor(chessInstance, color) {
  if (!chessInstance || !color) {
    return "";
  }

  const board = chessInstance.board();

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    const rank = board[rankIndex];

    for (let fileIndex = 0; fileIndex < rank.length; fileIndex += 1) {
      const piece = rank[fileIndex];

      if (piece?.type !== "k" || piece.color !== color) {
        continue;
      }

      const file = String.fromCharCode(97 + fileIndex);
      const rankNumber = 8 - rankIndex;
      return `${file}${rankNumber}`;
    }
  }

  return "";
}

function getOpponentColor(playerColor) {
  return playerColor === "b" ? "w" : "b";
}

function buildResignHighlight(square) {
  if (!square) {
    return {};
  }

  return {
    [square]: {
      background:
        "linear-gradient(0deg, rgba(255, 56, 56, 0.72) 0%, rgba(164, 0, 0, 0.82) 100%)",
      boxShadow: "inset 0 0 0 3px rgba(255, 186, 186, 0.92)",
    },
  };
}

function areSquareHighlightsEqual(currentHighlights, nextHighlights) {
  const currentKeys = Object.keys(currentHighlights || {});
  const nextKeys = Object.keys(nextHighlights || {});

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return currentKeys.every((key) => {
    const currentStyle = currentHighlights?.[key] || null;
    const nextStyle = nextHighlights?.[key] || null;

    return (
      currentStyle?.background === nextStyle?.background &&
      currentStyle?.boxShadow === nextStyle?.boxShadow
    );
  });
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

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

function isDrawFinishedReason(reason) {
  return (
    reason === "draw_agreed" ||
    reason === "stalemate" ||
    reason === "insufficient_material" ||
    reason === "threefold_repetition" ||
    reason === "draw"
  );
}

function buildGameResultPresentation({
  finishedReason,
  winnerId,
  currentUserId,
}) {
  if (!finishedReason) {
    return null;
  }

  const didCurrentUserWin = Boolean(winnerId) && winnerId === currentUserId;
  const didCurrentUserLose = Boolean(winnerId) && winnerId !== currentUserId;

  if (isDrawFinishedReason(finishedReason) || !winnerId) {
    let subtitle = "Ничья.";
    let reasonLabel = "Результат: ничья";

    if (finishedReason === "stalemate") {
      subtitle = "Ничья патом.";
      reasonLabel = "Пат";
    } else if (finishedReason === "draw_agreed") {
      subtitle = "Ничья по соглашению.";
      reasonLabel = "Согласованная ничья";
    } else if (finishedReason === "insufficient_material") {
      subtitle = "Ничья из-за недостатка материала.";
      reasonLabel = "Недостаточно материала";
    } else if (finishedReason === "threefold_repetition") {
      subtitle = "Ничья по троекратному повторению.";
      reasonLabel = "Троекратное повторение";
    }

    return {
      outcome: "draw",
      title: "Ничья",
      subtitle,
      reasonLabel,
      score: "1/2 - 1/2",
    };
  }

  if (finishedReason === "checkmate") {
    return didCurrentUserWin
      ? {
          outcome: "win",
          title: "Победа",
          subtitle: "Победа матом.",
          reasonLabel: "Шах и мат",
          score: "1 - 0",
        }
      : {
          outcome: "loss",
          title: "Поражение",
          subtitle: "Поражение матом.",
          reasonLabel: "Шах и мат",
          score: "0 - 1",
        };
  }

  if (finishedReason === "resign") {
    return didCurrentUserWin
      ? {
          outcome: "win",
          title: "Победа",
          subtitle: "Победа: противник сдался.",
          reasonLabel: "Сдача соперника",
          score: "1 - 0",
        }
      : {
          outcome: "loss",
          title: "Поражение",
          subtitle: "Поражение: вы сдались.",
          reasonLabel: "Сдача",
          score: "0 - 1",
        };
  }

  if (finishedReason === "timeout") {
    return didCurrentUserWin
      ? {
          outcome: "win",
          title: "Победа",
          subtitle: "Победа: у противника вышло время.",
          reasonLabel: "Время вышло",
          score: "1 - 0",
        }
      : {
          outcome: "loss",
          title: "Поражение",
          subtitle: "Поражение: у вас вышло время.",
          reasonLabel: "Время вышло",
          score: "0 - 1",
        };
  }

  if (didCurrentUserWin) {
    return {
      outcome: "win",
      title: "Победа",
      subtitle: "Партия завершена в вашу пользу.",
      reasonLabel: "Игра завершена",
      score: "1 - 0",
    };
  }

  if (didCurrentUserLose) {
    return {
      outcome: "loss",
      title: "Поражение",
      subtitle: "Партия завершена не в вашу пользу.",
      reasonLabel: "Игра завершена",
      score: "0 - 1",
    };
  }

  return null;
}

export default function PlayPage() {
  const reliableNavigate = useReliableNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game") || "";
  const { user, refreshCurrency } = useAuth();
  const { showNotification, dismissNotification } = useNotifications();
  const [topReaction, setTopReaction] = useState(null);
  const [bottomReaction, setBottomReaction] = useState(null);
  const [emojiCooldownActive, setEmojiCooldownActive] = useState(false);
  const [memeEffectsVolume, setMemeEffectsVolume] = useState(() =>
    readStoredMemeEffectsVolume()
  );
  const [emojiVolume, setEmojiVolume] = useState(() => readStoredEmojiVolume());
  const [actionNotice, setActionNotice] = useState("");
  const [isResignConfirmMode, setIsResignConfirmMode] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [finishedEventResult, setFinishedEventResult] = useState(null);
  const [extraHighlightedSquares, setExtraHighlightedSquares] = useState({});
  const [emojiQuickAccessIds, setEmojiQuickAccessIds] = useState([]);
  const topReactionTimeoutRef = useRef(null);
  const bottomReactionTimeoutRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);
  const activeReactionAudioEntriesRef = useRef(new Set());
  const finishedCurrencyRefreshKeyRef = useRef("");
  const lastEvolutionMoveCountRef = useRef(null);
  const { viewportRef, layout, handleBoardMetricsChange } =
    useResponsiveWorkspaceLayout();

  const onlineRoom = useOnlineGameRoom(gameId);
  const localBotRoom = useLocalBotGameRoom(gameId);
  const activeRoom = localBotRoom.isLocalBotGame ? localBotRoom : onlineRoom;
  const currentUserId = String(activeRoom.currentUserId || user?.id || "").trim();
  const opponentColor = getOpponentColor(activeRoom.playerColor);
  const roomState = activeRoom.roomState;
  const currentPieceSkinSlug =
    normalizePieceSkinSlug(activeRoom.currentUserProfile?.piece_skin_slug) ||
    readStoredPieceSkin() ||
    DEFAULT_PIECE_SKIN_SLUG;
  const opponentPieceSkinSlug =
    normalizePieceSkinSlug(activeRoom.opponentProfile?.piece_skin_slug) ||
    DEFAULT_PIECE_SKIN_SLUG;
  const currentSideColor =
    roomState?.player1_id && roomState.player1_id === currentUserId
      ? "w"
      : roomState?.player2_id && roomState.player2_id === currentUserId
        ? "b"
        : activeRoom.playerColor || "w";
  const whitePieceSkinId =
    currentSideColor === "w"
      ? currentPieceSkinSlug
      : opponentPieceSkinSlug;
  const blackPieceSkinId =
    currentSideColor === "b"
      ? currentPieceSkinSlug
      : opponentPieceSkinSlug;
  const resolvedOpponentUserId =
    String(activeRoom.opponentUserId || "").trim() ||
    (currentUserId && roomState?.player1_id === currentUserId
      ? String(roomState?.player2_id || "").trim()
      : String(roomState?.player1_id || "").trim());
  const isGameFinished = roomState?.status === "finished";
  const finishedReason = String(
    roomState?.finished_reason || finishedEventResult?.finishedReason || ""
  ).trim();
  const winnerId = String(
    roomState?.winner_id || finishedEventResult?.winnerId || ""
  ).trim();
  const drawOfferedBy = String(roomState?.draw_offered_by || "").trim();
  const gameClock = useGameClock({
    gameId,
    roomState,
    fallbackTimeControl: activeRoom.matchTimeControl,
    currentUserId,
    opponentUserId: resolvedOpponentUserId,
    sessionToken: activeRoom.sessionToken,
    isOnlineGame: onlineRoom.isOnlineGame,
    isLocalBotGame: activeRoom.isLocalBotGame,
    onTimeoutResolved: activeRoom.applyRoomState,
  });
  const showTimedClocks = Boolean(gameClock.timed);

  const chessGameState = useChessGame({
    syncKey: gameId,
    preloadMemeAssets: Boolean(gameId),
    playerColor: activeRoom.playerColor,
    gameMode: activeRoom.matchGameMode || roomState?.game_mode || "",
    currentUserId,
    isBotGame: activeRoom.isBotGame,
    serverLegalMoves: roomState?.legal_moves || [],
    serverMoves: roomState?.moves || [],
    initialFen: roomState?.initial_fen || "",
    interactionLocked: isGameFinished,
    extraHighlightedSquares,
    preferStateMoveEffects: true,
    forceServerAuthoritative: activeRoom.isBotGame,
  });

  const emojiOwnerId =
    activeRoom.currentUserProfile?.id || activeRoom.currentUserId || user?.id;
  const emojiQuickAccessItems = useMemo(
    () => resolveEmojiQuickAccessItems(emojiQuickAccessIds),
    [emojiQuickAccessIds]
  );

  useEffect(() => {
    setEmojiQuickAccessIds(readStoredEmojiQuickAccess(emojiOwnerId));
  }, [emojiOwnerId]);

  useEffect(() => {
    if (!emojiOwnerId) {
      return () => {};
    }

    return subscribeEmojiQuickAccessChanges(emojiOwnerId, (nextIds) => {
      setEmojiQuickAccessIds(nextIds);
    });
  }, [emojiOwnerId]);

  const socketOptions = onlineRoom.buildSocketOptions(chessGameState);

  const drawControls = useMemo(() => {
    if (isResignConfirmMode) {
      return {
        mode: "resign_confirm",
        message: "Вы уверены, что хотите сдаться?",
      };
    }

    if (isGameFinished && finishedReason === "draw_agreed") {
      return {
        mode: "accepted",
        message: "Ничья согласована. Партия завершена.",
      };
    }

    if (isGameFinished && finishedReason === "resign") {
      return {
        mode: "notice",
        message:
          winnerId && winnerId === currentUserId
            ? "Соперник сдался."
            : "Вы сдались.",
      };
    }

    if (drawOfferedBy) {
      return drawOfferedBy === currentUserId
        ? {
            mode: "outgoing",
            message: "Предложение ничьи отправлено. Ждем ответ соперника.",
          }
        : {
            mode: "incoming",
            message: `${activeRoom.opponentName} предлагает ничью.`,
          };
    }

    if (actionNotice) {
      return {
        mode: "notice",
        message: actionNotice,
      };
    }

    return null;
  }, [
    actionNotice,
    currentUserId,
    drawOfferedBy,
    finishedReason,
    isResignConfirmMode,
    isGameFinished,
    activeRoom.opponentName,
    winnerId,
  ]);
  const resultPresentation = useMemo(
    () =>
      finishedReason
        ? buildGameResultPresentation({
            finishedReason,
            winnerId,
            currentUserId,
          })
        : null,
    [currentUserId, finishedReason, winnerId]
  );
  const resultModalKey = finishedReason
    ? [gameId, finishedReason, winnerId, roomState?.moves?.length || 0].join(":")
    : "";

  function updateActiveReactionAudioVolumes(nextLayerVolume = emojiVolume) {
    activeReactionAudioEntriesRef.current.forEach((entry) => {
      if (!entry?.audio || entry.audio.ended) {
        activeReactionAudioEntriesRef.current.delete(entry);
        return;
      }

      entry.audio.volume = Math.min(
        1,
        Math.max(0, entry.baseVolume * nextLayerVolume)
      );
    });
  }

  function playEmojiSound(reaction) {
    const reactionPayload = normalizeReactionInput(reaction);
    if (!reactionPayload?.soundSrc) {
      return;
    }

    const sound = new Audio(reactionPayload.soundSrc);
    const entry = {
      audio: sound,
      baseVolume: 0.65,
    };
    const unregisterAudio = () => {
      activeReactionAudioEntriesRef.current.delete(entry);
    };

    sound.volume = Math.min(1, Math.max(0, entry.baseVolume * emojiVolume));
    activeReactionAudioEntriesRef.current.add(entry);
    sound.addEventListener("ended", unregisterAudio, { once: true });
    sound.addEventListener("error", unregisterAudio, { once: true });
    sound.play().catch(() => {});
  }

  function clearReactionTimer(side) {
    const timeoutRef =
      side === "top" ? topReactionTimeoutRef : bottomReactionTimeoutRef;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  async function showReaction(side, reactionInput, withSound = true) {
    const reaction = normalizeReactionInput(reactionInput);
    if (!reaction) {
      return;
    }

    const setReaction = side === "top" ? setTopReaction : setBottomReaction;
    const timeoutRef =
      side === "top" ? topReactionTimeoutRef : bottomReactionTimeoutRef;

    clearReactionTimer(side);
    const durationMs = await resolveReactionDurationMs(reaction);
    const timedReaction = {
      ...reaction,
      durationMs,
    };

    setReaction(timedReaction);

    timeoutRef.current = window.setTimeout(() => {
      setReaction(null);
      timeoutRef.current = null;
    }, durationMs);

    if (withSound) {
      playEmojiSound(timedReaction);
    }
  }

  function handleIncomingEmoji(event) {
    if (!event?.reaction && !event?.emojiId) {
      return;
    }

    if (event.isOwnMessage) {
      return;
    }

    showReaction("top", event.reaction || event.emojiId);
  }

  function handleIncomingGameEvent(event) {
    if (!event?.type) {
      return;
    }

    if (event.type === "game.event.draw_declined") {
      const declinedBy = String(
        event.payload?.by_user_id || event.payload?.byUserId || event.senderUserId || ""
      ).trim();

      setActionNotice(
        declinedBy && declinedBy === currentUserId
          ? "Вы отклонили предложение ничьей."
          : "Соперник отклонил предложение ничьей."
      );
      return;
    }

    if (event.type === "game.finished") {
      const eventFinishedReason = String(
        event.payload?.finished_reason || event.payload?.finishedReason || ""
      ).trim();
      const eventWinnerId = String(
        event.payload?.winner_id || event.payload?.winnerId || ""
      ).trim();

      setIsResignConfirmMode(false);
      setActionNotice("");
      setFinishedEventResult({
        finishedReason: eventFinishedReason,
        winnerId: eventWinnerId,
      });
      setIsResultModalOpen(true);
      return;
    }

    if (
      event.type === "game.draw.offer.accepted" ||
      event.type === "game.draw.accept.accepted" ||
      event.type === "game.draw.decline.accepted" ||
      event.type === "game.resign.accepted"
    ) {
      return;
    }
  }

  const socketClient = useGameSocket({
    onRemoteMove: undefined,
    onStateChange: socketOptions?.onStateChange,
    onJoined: socketOptions?.onJoined,
    onOpen: socketOptions?.onOpen,
    onClose: socketOptions?.onClose,
    onError: (error) => {
      socketOptions?.onError?.(error);

      if (error?.code === "SOCKET_CONNECTION_FAILED") {
        return;
      }

      setActionNotice(
        error?.message || "Не удалось выполнить действие в игровой комнате."
      );
    },
    onEmoji: handleIncomingEmoji,
    onGameEvent: handleIncomingGameEvent,
    enabled: Boolean(
      !activeRoom.isLocalBotGame &&
        onlineRoom.isOnlineGame &&
        onlineRoom.hasOnlineAccess
    ),
    gameId: socketOptions?.gameId,
    userId: socketOptions?.userId,
    token: socketOptions?.token,
    allowDebugToken: socketOptions?.allowDebugToken,
  });
  const roomControls = activeRoom.isLocalBotGame ? activeRoom : socketClient;

  useEffect(() => {
    setActionNotice("");
    setIsResignConfirmMode(false);
    setIsResultModalOpen(false);
    setFinishedEventResult(null);
    setExtraHighlightedSquares({});
    lastEvolutionMoveCountRef.current = null;
  }, [gameId]);

  useEffect(() => {
    if (!resultModalKey) {
      return;
    }

    setIsResultModalOpen(true);
  }, [resultModalKey]);

  useEffect(() => {
    if (!activeRoom.isLocalBotGame || !roomState) {
      return;
    }

    chessGameState.syncFromServerState(roomState);
  }, [
    activeRoom.isLocalBotGame,
    roomState,
  ]);

  useEffect(() => {
    if (!activeRoom.socketError) {
      return;
    }

    if (
      activeRoom.isBotGame &&
      activeRoom.socketError === "Не удалось подключиться к игровой комнате."
    ) {
      return;
    }

    setActionNotice(activeRoom.socketError);
  }, [activeRoom.isBotGame, activeRoom.socketError]);

  useEffect(() => {
    function handleHistoryKeyDown(event) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        if (!chessGameState.canViewPrevious) {
          return;
        }

        event.preventDefault();
        chessGameState.viewPreviousMove();
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        if (!chessGameState.canViewNext) {
          return;
        }

        event.preventDefault();
        chessGameState.viewNextMove();
      }
    }

    window.addEventListener("keydown", handleHistoryKeyDown);
    return () => {
      window.removeEventListener("keydown", handleHistoryKeyDown);
    };
  }, [
    chessGameState.canViewNext,
    chessGameState.canViewPrevious,
    chessGameState.viewNextMove,
    chessGameState.viewPreviousMove,
  ]);

  useEffect(() => {
    updateActiveReactionAudioVolumes(emojiVolume);
  }, [emojiVolume]);

  useEffect(() => {
    return subscribeMemeEffectsVolumeChanges((volume) => {
      setMemeEffectsVolume(volume);
    });
  }, []);

  useEffect(() => {
    return subscribeEmojiVolumeChanges((volume) => {
      setEmojiVolume(volume);
    });
  }, []);

  useEffect(() => {
    return () => {
      clearReactionTimer("top");
      clearReactionTimer("bottom");
      dismissNotification("play-status");
      activeReactionAudioEntriesRef.current.forEach(({ audio }) => {
        audio.pause();
        audio.src = "";
      });
      activeReactionAudioEntriesRef.current.clear();

      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, [dismissNotification]);

  useEffect(() => {
    if (activeRoom.isLocalBotGame || !onlineRoom.isOnlineGame) {
      return;
    }

    void refreshCurrency().catch(() => {});
  }, [activeRoom.isLocalBotGame, onlineRoom.isOnlineGame, refreshCurrency]);

  useEffect(() => {
    if (
      activeRoom.isLocalBotGame ||
      !onlineRoom.isOnlineGame ||
      roomState?.status !== "finished" ||
      !gameId
    ) {
      return;
    }

    const refreshKey = `${gameId}:${winnerId}`;
    if (finishedCurrencyRefreshKeyRef.current === refreshKey) {
      return;
    }

    finishedCurrencyRefreshKeyRef.current = refreshKey;
    void refreshCurrency().catch(() => {});
  }, [
    activeRoom.isLocalBotGame,
    gameId,
    onlineRoom.isOnlineGame,
    refreshCurrency,
    roomState?.status,
    winnerId,
  ]);

  useEffect(() => {
    if (drawOfferedBy || isGameFinished) {
      setActionNotice("");
      setIsResignConfirmMode(false);
    }
  }, [drawOfferedBy, isGameFinished]);

  useEffect(() => {
    if (!drawControls?.message) {
      dismissNotification("play-status");
      return;
    }

    const isPersistent =
      drawControls.mode === "incoming" || drawControls.mode === "outgoing";
    const extendedPersistent =
      isPersistent || drawControls.mode === "resign_confirm";
    const tone =
      drawControls.mode === "notice" &&
      !isGameFinished &&
      !drawOfferedBy &&
      Boolean(actionNotice)
        ? "error"
        : "info";

    showNotification({
      id: "play-status",
      message: drawControls.message,
      tone,
      persist: extendedPersistent,
      duration: extendedPersistent ? 0 : 4500,
    });
  }, [
    actionNotice,
    dismissNotification,
    drawControls,
    drawOfferedBy,
    isGameFinished,
    showNotification,
  ]);

  useEffect(() => {
    const activeGameMode = String(
      activeRoom.matchGameMode || roomState?.game_mode || ""
    )
      .trim()
      .toLowerCase();

    if (activeGameMode !== "evolution") {
      lastEvolutionMoveCountRef.current = null;
      return;
    }

    const currentMoveCount = Array.isArray(roomState?.moves) ? roomState.moves.length : 0;
    if (lastEvolutionMoveCountRef.current === null) {
      lastEvolutionMoveCountRef.current = currentMoveCount;
      return;
    }

    const previousMoveCount = lastEvolutionMoveCountRef.current;
    lastEvolutionMoveCountRef.current = currentMoveCount;

    if (currentMoveCount <= previousMoveCount) {
      return;
    }

    EVOLUTION_STAGE_NOTICES.forEach((stage) => {
      if (previousMoveCount < stage.threshold && currentMoveCount >= stage.threshold) {
        showNotification({
          id: `evolution-stage-${stage.threshold}`,
          title: stage.title,
          message: stage.message,
          tone: "info",
          duration: 7000,
        });
      }
    });
  }, [
    activeRoom.matchGameMode,
    roomState?.game_mode,
    roomState?.moves,
    showNotification,
  ]);

  useEffect(() => {
    if (!isGameFinished || finishedReason !== "resign") {
      setExtraHighlightedSquares((currentHighlights) =>
        Object.keys(currentHighlights).length === 0 ? currentHighlights : {}
      );
      return;
    }

    const loserColor =
      winnerId && winnerId === currentUserId
        ? opponentColor
        : activeRoom.playerColor;
    const kingSquare =
      findKingSquareByColor(chessGameState.game, loserColor) ||
      findKingSquareByColor(chessGameState.displayedGame, loserColor);

    const nextHighlights = buildResignHighlight(kingSquare);

    setExtraHighlightedSquares((currentHighlights) =>
      areSquareHighlightsEqual(currentHighlights, nextHighlights)
        ? currentHighlights
        : nextHighlights
    );
  }, [
    chessGameState.displayedGame,
    chessGameState.game,
    currentUserId,
    finishedReason,
    isGameFinished,
    activeRoom.playerColor,
    opponentColor,
    winnerId,
  ]);

  function startEmojiCooldown() {
    if (cooldownTimeoutRef.current) {
      window.clearTimeout(cooldownTimeoutRef.current);
    }

    setEmojiCooldownActive(true);
    cooldownTimeoutRef.current = window.setTimeout(() => {
      setEmojiCooldownActive(false);
      cooldownTimeoutRef.current = null;
    }, EMOJI_COOLDOWN_MS);
  }

  function handleEmojiSelect(item) {
    const reaction = createReactionFromItem(item);
    if (!reaction || emojiCooldownActive) {
      return;
    }

    startEmojiCooldown();
    showReaction("bottom", reaction);
    roomControls.sendEmoji(reaction);
  }

  function handleMemeEffectsVolumeChange(nextVolume) {
    setMemeEffectsVolume(nextVolume);
    persistMemeEffectsVolume(nextVolume);
  }

  function handleEmojiVolumeChange(nextVolume) {
    setEmojiVolume(nextVolume);
    persistEmojiVolume(nextVolume);
  }

  async function handleResign() {
    if (isGameFinished || !gameId || !roomState) {
      return;
    }

    setActionNotice("");
    setIsResignConfirmMode(true);
  }

  function handleResignCancel() {
    setIsResignConfirmMode(false);
  }

  async function handleResignConfirm() {
    if (isGameFinished || !gameId || !roomState) {
      return;
    }

    chessGameState.jumpToLatestMove();

    if (!roomControls.sendResign()) {
      setActionNotice("Не удалось отправить сдачу. Попробуйте еще раз.");
      setIsResignConfirmMode(false);
      return;
    }

    setIsResignConfirmMode(false);
  }

  async function handleDrawOffer() {
    if (isGameFinished || !gameId || !roomState || drawOfferedBy) {
      return;
    }

    chessGameState.jumpToLatestMove();

    if (!roomControls.sendDrawOffer()) {
      setActionNotice("Не удалось предложить ничью. Попробуйте еще раз.");
    }
  }

  async function handleDrawAccept() {
    if (isGameFinished || !gameId || !roomState || drawOfferedBy === currentUserId) {
      return;
    }

    if (!drawOfferedBy) {
      return;
    }

    if (!roomControls.sendDrawAccept()) {
      setActionNotice("Не удалось принять ничью. Попробуйте еще раз.");
    }
  }

  async function handleDrawDecline() {
    if (isGameFinished || !gameId || !roomState || drawOfferedBy === currentUserId) {
      return;
    }

    if (!drawOfferedBy) {
      return;
    }

    if (!roomControls.sendDrawDecline()) {
      setActionNotice("Не удалось отклонить ничью. Попробуйте еще раз.");
    }
  }

  function handleCloseResultModal() {
    setIsResultModalOpen(false);
  }

  function handleResultPrimaryAction() {
    reliableNavigate("/");
  }

  if (!activeRoom.isLocalBotGame && onlineRoom.isWaitingForAuthBootstrap) {
    return (
      <StatusCard
        title="Подключаем к игре"
        description="Проверяем сохраненную сессию перед входом в комнату..."
      />
    );
  }

  if (!activeRoom.isLocalBotGame && onlineRoom.isOnlineGame && !onlineRoom.hasOnlineAccess) {
    return (
      <StatusCard
        title="Сессия игры не найдена"
        description="Откройте ссылку-приглашение заново, чтобы восстановить корректные игровые данные для этой комнаты."
        action={
          <Link to="/" style={{ textDecoration: "none" }}>
            <Button variant="primary">На главную</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden">
        <AppSidebar />
        <main className="flex h-full min-h-0 flex-1 overflow-hidden px-[clamp(20px,3vw,60px)] py-[clamp(16px,2.2vh,24px)]">
          <div
            ref={viewportRef}
            className="mx-auto flex h-full w-full min-w-0 items-start justify-center overflow-hidden"
            style={{ gap: layout.contentGap }}
          >
            <div className="relative flex h-full min-w-0 flex-1 justify-center overflow-hidden">
                <ChessBoardSection
                  gameState={chessGameState}
                  sendMove={roomControls.sendMove}
                  boardWidth={layout.boardSize}
                  onLayoutMetricsChange={handleBoardMetricsChange}
                  whitePieceSkinId={whitePieceSkinId}
                  blackPieceSkinId={blackPieceSkinId}
                  topPlayerName={activeRoom.opponentName}
                  topPlayerAvatar={
                    activeRoom.opponentProfile?.avatar_url || DEFAULT_AVATAR
                  }
                  topPlayerProfileHref={
                    activeRoom.opponentProfile?.id === user?.id ? "/profile" : ""
                  }
                  bottomPlayerName={activeRoom.currentUserName}
                  bottomPlayerAvatar={
                    activeRoom.currentUserProfile?.avatar_url || DEFAULT_AVATAR
                  }
                  bottomPlayerProfileHref={
                    activeRoom.currentUserProfile?.id === user?.id ? "/profile" : ""
                  }
                  topReaction={topReaction}
                  bottomReaction={bottomReaction}
                  topPlayerTimer={gameClock.top}
                  bottomPlayerTimer={gameClock.bottom}
                showPlayerTimers={showTimedClocks}
                topPlayerTime={gameClock.top?.time || "∞"}
                bottomPlayerTime={gameClock.bottom?.time || "∞"}
                topPlayerTimerTone={gameClock.top?.tone || "idle"}
                bottomPlayerTimerTone={gameClock.bottom?.tone || "idle"}
                topPlayerTimerActive={Boolean(gameClock.top?.isActive)}
                bottomPlayerTimerActive={Boolean(gameClock.bottom?.isActive)}
                topPlayerEmojiVolume={emojiVolume}
                onTopPlayerEmojiVolumeChange={handleEmojiVolumeChange}
                boardOverlay={
                  <GameResultModal
                    isOpen={Boolean(resultPresentation && isResultModalOpen)}
                    outcome={resultPresentation?.outcome}
                    title={resultPresentation?.title}
                    subtitle={resultPresentation?.subtitle}
                    reasonLabel={resultPresentation?.reasonLabel}
                    score={resultPresentation?.score}
                    boardSize={layout.boardSize}
                    currentPlayer={{
                      name: activeRoom.currentUserName,
                      avatar_url: activeRoom.currentUserProfile?.avatar_url || "",
                    }}
                    opponentPlayer={{
                      name: activeRoom.opponentName,
                      avatar_url: activeRoom.opponentProfile?.avatar_url || "",
                    }}
                    onPrimaryAction={handleResultPrimaryAction}
                    onSecondaryAction={handleCloseResultModal}
                  />
                }
              />
            </div>

            <div
              className="shrink-0"
              style={{
                width: layout.panelWidth,
              }}
            >
              <GameSettingsPanel
                style={{
                  width: "100%",
                  height: layout.panelHeight,
                }}
                emojiQuickAccessItems={emojiQuickAccessItems}
                onEmojiSelect={handleEmojiSelect}
                emojiCooldownActive={emojiCooldownActive}
                history={chessGameState.history}
                historyEntries={chessGameState.historyEntries}
                activeHistoryPly={chessGameState.activeHistoryPly}
                canViewPrevious={chessGameState.canViewPrevious}
                canViewNext={chessGameState.canViewNext}
                onPreviousMove={chessGameState.viewPreviousMove}
                onNextMove={chessGameState.viewNextMove}
                memeEffectsVolume={memeEffectsVolume}
                onMemeEffectsVolumeChange={handleMemeEffectsVolumeChange}
                onResign={handleResign}
                onResignConfirm={handleResignConfirm}
                onResignCancel={handleResignCancel}
                onDraw={handleDrawOffer}
                onDrawAccept={handleDrawAccept}
                onDrawDecline={handleDrawDecline}
                drawOfferState={drawControls}
                isResignConfirmMode={isResignConfirmMode}
                stakeAmount={activeRoom.matchStake}
                gameCurrencyLabel={activeRoom.matchGameCurrencyLabel}
                gameModeLabel={activeRoom.matchGameModeLabel}
                actionsDisabled={
                  (!activeRoom.isLocalBotGame &&
                    (!onlineRoom.isOnlineGame || !onlineRoom.hasOnlineAccess)) ||
                  !roomState
                }
                resignDisabled={isGameFinished}
                drawDisabled={
                  isGameFinished || Boolean(drawOfferedBy) || activeRoom.isBotGame
                }
              />
            </div>
          </div>
        </main>
      </div>
      <GameResultModal
        isOpen={false}
        outcome={resultPresentation?.outcome}
        title={resultPresentation?.title}
        subtitle={resultPresentation?.subtitle}
        reasonLabel={resultPresentation?.reasonLabel}
        score={resultPresentation?.score}
        boardSize={layout.boardSize}
        currentPlayer={{
          name: activeRoom.currentUserName,
          avatar_url: activeRoom.currentUserProfile?.avatar_url || "",
        }}
        opponentPlayer={{
          name: activeRoom.opponentName,
          avatar_url: activeRoom.opponentProfile?.avatar_url || "",
        }}
        primaryActionLabel="На главную"
        onPrimaryAction={handleResultPrimaryAction}
        secondaryActionLabel="Посмотреть доску"
        onSecondaryAction={handleCloseResultModal}
        anchorRect={null}
      />
    </div>
  );
}
