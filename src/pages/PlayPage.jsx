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
import { useAuth } from "../features/auth/useAuth.js";
import {
  readStoredEmojiQuickAccess,
  resolveEmojiQuickAccessItems,
  resolveEmojiReactionById,
} from "../shared/lib/emojiQuickAccess.js";
import { withAssetBase } from "../shared/lib/assets.js";
import { useResponsiveWorkspaceLayout } from "../features/chess/hooks/useResponsiveWorkspaceLayout.js";
import {
  acceptDrawOffer,
  declineDrawOffer,
  offerDraw,
  resignGame,
} from "../features/game/gameApi.js";

const EMOJI_COOLDOWN_MS = 10_000;
const EMOJI_POPUP_DURATION_MS = 2_400;
const reactionDurationCache = new Map();

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

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game") || "";
  const { user, refreshCurrency } = useAuth();
  const [topReaction, setTopReaction] = useState(null);
  const [bottomReaction, setBottomReaction] = useState(null);
  const [emojiCooldownActive, setEmojiCooldownActive] = useState(false);
  const [localFinishState, setLocalFinishState] = useState(null);
  const [drawOfferState, setDrawOfferState] = useState({
    mode: "idle",
    message: "",
  });
  const topReactionTimeoutRef = useRef(null);
  const bottomReactionTimeoutRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);
  const finishedCurrencyRefreshKeyRef = useRef("");
  const { viewportRef, layout, handleBoardMetricsChange } =
    useResponsiveWorkspaceLayout();

  const onlineRoom = useOnlineGameRoom(gameId);
  const isServerFinished = onlineRoom.roomState?.status === "finished";
  const activeLocalFinishState =
    localFinishState?.gameId === gameId && !isServerFinished ? localFinishState : null;
  const resignationKingSquare = activeLocalFinishState?.kingSquare || "";
  const resignationHighlightSquares = useMemo(() => {
    if (!resignationKingSquare) {
      return {};
    }

    return {
      [resignationKingSquare]: {
        background:
          "linear-gradient(0deg, rgba(255, 56, 56, 0.72) 0%, rgba(164, 0, 0, 0.82) 100%)",
        boxShadow: "inset 0 0 0 3px rgba(255, 186, 186, 0.92)",
      },
    };
  }, [resignationKingSquare]);
  const isGameFinished = isServerFinished || Boolean(activeLocalFinishState);
  const chessGameState = useChessGame({
    playerColor: onlineRoom.playerColor,
    interactionLocked: isGameFinished,
    extraHighlightedSquares: resignationHighlightSquares,
  });

  const emojiOwnerId = onlineRoom.currentUserProfile?.id || user?.id;
  const emojiQuickAccessItems = useMemo(() => {
    const quickAccessIds = readStoredEmojiQuickAccess(emojiOwnerId);
    return resolveEmojiQuickAccessItems(quickAccessIds);
  }, [emojiOwnerId]);

  const socketOptions = onlineRoom.buildSocketOptions(chessGameState);
  const opponentColor = getOpponentColor(onlineRoom.playerColor);
  const drawControls = useMemo(() => {
    switch (drawOfferState.mode) {
      case "incoming":
        return {
          mode: "incoming",
          message: `${onlineRoom.opponentName} предлагает ничью.`,
        };
      case "outgoing":
        return {
          mode: "outgoing",
          message: "Предложение ничьей отправлено. Ждем ответ соперника.",
        };
      case "accepted":
        return {
          mode: "accepted",
          message: "Ничья принята. Партия завершена.",
        };
      case "declined":
      case "notice":
        return {
          mode: drawOfferState.mode,
          message: drawOfferState.message,
        };
      default:
        return null;
    }
  }, [drawOfferState, onlineRoom.opponentName]);

  function playEmojiSound(reaction) {
    const reactionPayload = normalizeReactionInput(reaction);
    if (!reactionPayload?.soundSrc) {
      return;
    }

    const sound = new Audio(reactionPayload.soundSrc);
    sound.volume = 0.65;
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

    if (event.type === "game.resign") {
      const loserIsCurrentPlayer = event.isOwnMessage;
      const loserColor = loserIsCurrentPlayer
        ? onlineRoom.playerColor
        : opponentColor;
      const kingSquare =
        findKingSquareByColor(chessGameState.game, loserColor) ||
        findKingSquareByColor(chessGameState.displayedGame, loserColor);

      setDrawOfferState({
        mode: "idle",
        message: "",
      });
      setLocalFinishState({
        gameId,
        finishedReason: "resign",
        winnerId: loserIsCurrentPlayer
          ? onlineRoom.opponentUserId || ""
          : onlineRoom.currentUserId || user?.id || "",
        loserId: loserIsCurrentPlayer
          ? onlineRoom.currentUserId || user?.id || ""
          : onlineRoom.opponentUserId || "",
        kingSquare,
      });
      return;
    }

    if (event.type === "game.draw.offer") {
      setDrawOfferState({
        mode: event.isOwnMessage ? "outgoing" : "incoming",
        message: "",
      });
      return;
    }

    if (event.type === "game.draw.accept") {
      setDrawOfferState({
        mode: "accepted",
        message: "",
      });
      setLocalFinishState({
        gameId,
        finishedReason: "draw",
        winnerId: "",
        loserId: "",
        kingSquare: "",
      });
      return;
    }

    if (event.type === "game.draw.decline") {
      setDrawOfferState({
        mode: "declined",
        message: "Предложение ничьей отклонено.",
      });
    }
  }

  const socketClient = useGameSocket({
    onRemoteMove: chessGameState.applyRemoteMove,
    onStateChange: socketOptions?.onStateChange,
    onJoined: socketOptions?.onJoined,
    onOpen: socketOptions?.onOpen,
    onClose: socketOptions?.onClose,
    onError: socketOptions?.onError,
    onEmoji: handleIncomingEmoji,
    onGameEvent: handleIncomingGameEvent,
    enabled: Boolean(onlineRoom.isOnlineGame && onlineRoom.hasOnlineAccess),
    gameId: socketOptions?.gameId,
    userId: socketOptions?.userId,
    token: socketOptions?.token,
    allowDebugToken: socketOptions?.allowDebugToken,
  });

  useEffect(() => {
    setLocalFinishState(null);
    setDrawOfferState({
      mode: "idle",
      message: "",
    });
  }, [gameId]);

  useEffect(() => {
    return () => {
      clearReactionTimer("top");
      clearReactionTimer("bottom");

      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!onlineRoom.isOnlineGame) {
      return;
    }

    void refreshCurrency().catch(() => {});
  }, [onlineRoom.isOnlineGame, refreshCurrency]);

  useEffect(() => {
    if (onlineRoom.roomState?.status !== "finished" || !gameId) {
      return;
    }

    const refreshKey = `${gameId}:${onlineRoom.roomState?.winner_id || ""}`;
    if (finishedCurrencyRefreshKeyRef.current === refreshKey) {
      return;
    }

    finishedCurrencyRefreshKeyRef.current = refreshKey;
    void refreshCurrency().catch(() => {});
  }, [
    gameId,
    onlineRoom.roomState?.status,
    onlineRoom.roomState?.winner_id,
    refreshCurrency,
  ]);

  useEffect(() => {
    if (onlineRoom.roomState?.status !== "finished") {
      return;
    }

    setDrawOfferState((current) =>
      current.mode === "accepted"
        ? current
        : {
            mode: "idle",
            message: "",
          }
    );
  }, [onlineRoom.roomState?.status]);

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
    socketClient.sendEmoji(reaction);
  }

  async function handleResign() {
    if (isGameFinished || !gameId || !onlineRoom.sessionToken) {
      return;
    }

    chessGameState.jumpToLatestMove();
    try {
      await resignGame(gameId, onlineRoom.sessionToken);
    } catch (error) {
      setDrawOfferState({
        mode: "notice",
        message: error?.message || "Не удалось сдаться.",
      });
      return;
    }

    const loserColor = onlineRoom.playerColor === "b" ? "b" : "w";
    const kingSquare =
      findKingSquareByColor(chessGameState.game, loserColor) ||
      findKingSquareByColor(chessGameState.displayedGame, loserColor);

    setLocalFinishState({
      gameId,
      finishedReason: "resign",
      winnerId: onlineRoom.opponentUserId || "",
      loserId: onlineRoom.currentUserId || user?.id || "",
      kingSquare,
    });
  }

  async function handleDrawOffer() {
    if (
      isGameFinished ||
      !gameId ||
      !onlineRoom.sessionToken ||
      drawOfferState.mode === "outgoing" ||
      drawOfferState.mode === "incoming"
    ) {
      return;
    }

    try {
      await offerDraw(gameId, onlineRoom.sessionToken);
      setDrawOfferState({
        mode: "outgoing",
        message: "",
      });
    } catch (error) {
      setDrawOfferState({
        mode: "notice",
        message: error?.message || "Не удалось предложить ничью.",
      });
    }
  }

  async function handleDrawAccept() {
    if (
      isGameFinished ||
      !gameId ||
      !onlineRoom.sessionToken ||
      drawOfferState.mode !== "incoming"
    ) {
      return;
    }

    try {
      await acceptDrawOffer(gameId, onlineRoom.sessionToken);
      setDrawOfferState({
        mode: "accepted",
        message: "",
      });
      setLocalFinishState({
        gameId,
        finishedReason: "draw",
        winnerId: "",
        loserId: "",
        kingSquare: "",
      });
    } catch (error) {
      setDrawOfferState({
        mode: "notice",
        message: error?.message || "Не удалось принять ничью.",
      });
    }
  }

  async function handleDrawDecline() {
    if (
      isGameFinished ||
      !gameId ||
      !onlineRoom.sessionToken ||
      drawOfferState.mode !== "incoming"
    ) {
      return;
    }

    try {
      await declineDrawOffer(gameId, onlineRoom.sessionToken);
      setDrawOfferState({
        mode: "declined",
        message: "Предложение ничьей отклонено.",
      });
    } catch (error) {
      setDrawOfferState({
        mode: "notice",
        message: error?.message || "Не удалось отклонить ничью.",
      });
    }
  }

  if (onlineRoom.isWaitingForAuthBootstrap) {
    return (
      <StatusCard
        title="Подключаем к игре"
        description="Проверяем сохраненную сессию перед входом в комнату..."
      />
    );
  }

  if (onlineRoom.isOnlineGame && !onlineRoom.hasOnlineAccess) {
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
            <div className="flex h-full min-w-0 flex-1 justify-center overflow-hidden">
              <ChessBoardSection
                gameState={chessGameState}
                sendMove={socketClient.sendMove}
                boardWidth={layout.boardSize}
                onLayoutMetricsChange={handleBoardMetricsChange}
                topPlayerName={onlineRoom.opponentName}
                topPlayerAvatar={
                  onlineRoom.opponentProfile?.avatar_url || DEFAULT_AVATAR
                }
                bottomPlayerName={onlineRoom.currentUserName}
                bottomPlayerAvatar={
                  onlineRoom.currentUserProfile?.avatar_url || DEFAULT_AVATAR
                }
                topReaction={topReaction}
                bottomReaction={bottomReaction}
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
                history={chessGameState.game.history()}
                activeHistoryPly={chessGameState.activeHistoryPly}
                canViewPrevious={chessGameState.canViewPrevious}
                canViewNext={chessGameState.canViewNext}
                onPreviousMove={chessGameState.viewPreviousMove}
                onNextMove={chessGameState.viewNextMove}
                onResign={handleResign}
                onDraw={handleDrawOffer}
                onDrawAccept={handleDrawAccept}
                onDrawDecline={handleDrawDecline}
                drawOfferState={drawControls}
                stakeAmount={onlineRoom.matchStake}
                gameCurrencyLabel={onlineRoom.matchGameCurrencyLabel}
                gameModeLabel={onlineRoom.matchGameModeLabel}
                actionsDisabled={!onlineRoom.isOnlineGame || !onlineRoom.hasOnlineAccess}
                resignDisabled={isGameFinished}
                drawDisabled={
                  isGameFinished ||
                  drawOfferState.mode === "outgoing" ||
                  drawOfferState.mode === "incoming" ||
                  drawOfferState.mode === "accepted"
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
