import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chess } from "chess.js";

import ResponsivePanelFrame from "../components/atoms/ResponsivePanelFrame.jsx";
import * as authApi from "../features/auth/authApi.js";
import { useAuth } from "../features/auth/useAuth.js";
import { getPieceSkinAssets } from "../features/chess/lib/boardPieces.jsx";
import { getMyGameHistory } from "../features/game/gameApi.js";
import { resolveTimeControlConfig } from "../features/game/model/timeControl.js";
import { useInventory } from "../features/inventory/useInventory.js";
import {
  DEFAULT_BOARD_SKIN_SLUG,
  DEFAULT_PIECE_SKIN_SLUG,
  getCustomizationItem,
} from "../shared/constants/customizationCatalog.js";
import { withAssetBase } from "../shared/lib/assets.js";
import {
  getBoardSkinConfig,
  readStoredBoardSkin,
} from "../shared/lib/boardSkin.js";
import { readStoredPieceSkin } from "../shared/lib/pieceSkin.js";
import {
  USERNAME_MAX_LENGTH,
  normalizeUsernameValue,
  validateUsername,
} from "../shared/lib/username.js";
import { useReliableNavigate } from "../shared/router/useReliableNavigate.js";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import { useIsMobile } from "../shared/hooks/useMediaQuery.js";
import MobileBottomNav from "../shared/ui/organisms/MobileBottomNav.jsx";

const fallbackAvatar = withAssetBase("/images/default-avatar.png");
const ratingIcon = withAssetBase("/icons/rock.svg");
const HISTORY_PAGE_SIZE = 10;

function formatDate(value, options = {}) {
  if (!value) {
    return "Не указано";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Не указано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: options.shortMonth ? "2-digit" : "long",
    year: "numeric",
    ...(options.withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(Number(value ?? 0));
}

function resolveGameModeLabel(gameMode) {
  switch (String(gameMode || "").trim().toLowerCase()) {
    case "classic":
      return "Classic";
    case "fischer":
      return "Fischer";
    case "evolution":
      return "Evolution";
    case "meme":
      return "Meme";
    default:
      return "Match";
  }
}

function resolveStatusMeta(entry, currentUserId) {
  const status = String(entry?.status || "").trim().toLowerCase();
  const winnerId = String(entry?.winnerId || "").trim();
  const isDraw =
    entry?.finishedReason === "draw_agreed" ||
    entry?.finishedReason === "stalemate" ||
    entry?.finishedReason === "insufficient_material" ||
    entry?.finishedReason === "threefold_repetition" ||
    entry?.finishedReason === "draw";

  if (status === "active") {
    return {
      label: "Активно",
      tone: "active",
    };
  }

  if (isDraw) {
    return {
      label: "Ничья",
      tone: "neutral",
    };
  }

  if (!winnerId) {
    return {
      label: "Поражение",
      tone: "danger",
    };
  }

  if (winnerId === currentUserId) {
    return {
      label: "Победа",
      tone: "success",
    };
  }

  return {
    label: "Поражение",
    tone: "danger",
  };
}

function resolveInventoryPreview(item) {
  const catalogItem = getCustomizationItem(item.slug);
  const resolvedTitle = catalogItem?.title || item.title || item.slug;

  if (item.type === "piece_skin") {
    return {
      kind: "image",
      title: resolvedTitle,
      src: catalogItem?.imageSrc || item.asset_url || "",
    };
  }

  if (item.type === "board_skin") {
    return {
      kind: "board",
      title: resolvedTitle,
      boardConfig: getBoardSkinConfig(item.slug || DEFAULT_BOARD_SKIN_SLUG),
    };
  }

  if (item.type === "emote") {
    return {
      kind: "video",
      title: resolvedTitle,
      src: catalogItem?.videoSrc || item.asset_url || "",
    };
  }

  return {
    kind: "placeholder",
    title: resolvedTitle,
  };
}

function cardStyle() {
  return {
    borderColor: "transparent",
    background: "#0A183C",
    boxShadow: "0 18px 36px rgba(2, 7, 24, 0.24)",
  };
}

function panelStyle() {
  return {
    borderColor: "transparent",
    background: "#0A183C",
    boxShadow: "0 18px 36px rgba(2, 7, 24, 0.2)",
  };
}

function chipStyle() {
  return {
    borderColor: "rgba(96, 131, 255, 0.18)",
    background: "rgba(13, 27, 73, 0.92)",
  };
}

function SurfaceNote({ children }) {
  return (
    <div
      className="rounded-tl-[18px] rounded-br-[18px] border px-[16px] py-[14px] text-[13px] leading-[1.6]"
      style={chipStyle()}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, className = "" }) {
  return (
    <div
      className={`m-0 block text-[22px] leading-none font-semibold tracking-[-0.04em] ${className}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </div>
  );
}

function HistoryBoardPreview({
  boardId,
  fen,
  boardOrientation,
  pieceSkinId,
  boardSkinId,
  boardWidth = 198,
}) {
  const pieceSkinAssets = useMemo(
    () => getPieceSkinAssets(pieceSkinId || DEFAULT_PIECE_SKIN_SLUG),
    [pieceSkinId]
  );
  const boardSkinConfig = useMemo(
    () => getBoardSkinConfig(boardSkinId || DEFAULT_BOARD_SKIN_SLUG),
    [boardSkinId]
  );
  const boardCells = useMemo(() => {
    if (!fen) {
      return [];
    }

    try {
      const chess = new Chess();
      chess.load(fen);
      const board = chess.board();
      const ranks = boardOrientation === "black" ? [...board].reverse() : board;

      return ranks.flatMap((rank) => {
        const files = boardOrientation === "black" ? [...rank].reverse() : rank;
        return files;
      });
    } catch {
      return [];
    }
  }, [boardOrientation, fen]);

  if (!fen || boardCells.length === 0) {
    return (
      <div
        className="flex h-[198px] items-center justify-center rounded-tl-[18px] rounded-br-[18px] border px-[18px] text-center text-[13px]"
        style={chipStyle()}
      >
        Превью позиции недоступно
      </div>
    );
  }

  return (
    <div
      id={boardId}
      className="overflow-hidden rounded-tl-[16px] rounded-br-[16px] border"
      style={{
        ...chipStyle(),
        width: boardWidth,
        height: boardWidth,
      }}
    >
      <div
        className="grid h-full w-full grid-cols-8"
        style={{ gridTemplateRows: "repeat(8, minmax(0, 1fr))" }}
      >
        {boardCells.map((piece, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isLight = (row + col) % 2 === 0;
          const pieceKey = piece
            ? `${piece.color}${piece.type.toUpperCase()}`
            : "";
          const pieceSrc = pieceKey ? pieceSkinAssets[pieceKey] : "";

          return (
            <div
              key={`${boardId}-${index}`}
              className="flex items-center justify-center"
              style={{
                backgroundColor: isLight
                  ? boardSkinConfig.lightSquare
                  : boardSkinConfig.darkSquare,
              }}
            >
              {pieceSrc ? (
                <img
                  src={pieceSrc}
                  alt={pieceKey}
                  draggable={false}
                  className="h-[76%] w-[76%] object-contain select-none"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryPreview({ item }) {
  const preview = resolveInventoryPreview(item);

  if (preview.kind === "image" && preview.src) {
    return (
      <img
        src={preview.src}
        alt={preview.title}
        className="h-full w-full object-cover"
      />
    );
  }

  if (preview.kind === "video" && preview.src) {
    return (
      <video
        src={preview.src}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }

  if (preview.kind === "board") {
    const boardConfig = preview.boardConfig;

    return (
      <div className="grid h-full w-full grid-cols-8 overflow-hidden">
        {Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isLight = (row + col) % 2 === 0;
          return (
            <div
              key={index}
              style={{
                backgroundColor: isLight
                  ? boardConfig.lightSquare
                  : boardConfig.darkSquare,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-tl-[18px] rounded-br-[18px] border text-[13px]"
      style={chipStyle()}
    >
      Предмет
    </div>
  );
}

function EditProfileModal({
  isOpen,
  user,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setUsername(user?.username || "");
    setAvatarFile(null);
    setAvatarPreviewUrl("");
    setRemoveAvatar(false);
  }, [isOpen, user?.avatar_url, user?.username]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (usernameError) {
      return;
    }

    await onSubmit?.({
      username,
      avatarFile,
      removeAvatar,
    });
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null;

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    if (!file) {
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  }

  function handleResetAvatar() {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(null);
    setAvatarPreviewUrl("");
    setRemoveAvatar(true);
  }

  const previewAvatar =
    avatarPreviewUrl || (!removeAvatar && user?.avatar_url) || fallbackAvatar;
  const currentUsername = String(user?.username || "").trim();
  const usernameChanged = username.trim() !== currentUsername;
  const usernameError = usernameChanged ? validateUsername(username) : "";
  const combinedErrorMessage = usernameError || errorMessage;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "var(--modal-backdrop)",
        backdropFilter: "blur(6px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-[32px] border p-[26px]"
        style={{
          width: "min(100%, 740px)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          borderColor: "rgba(68, 220, 255, 0.28)",
          background:
            "linear-gradient(180deg, rgba(16, 33, 91, 0.98) 0%, rgba(9, 21, 60, 0.98) 100%)",
          color: "#f5f7ff",
          boxShadow: "0 28px 60px rgba(2, 8, 26, 0.42)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h2 className="mt-[8px] text-[30px] font-semibold">
              Редактировать профиль
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-[18px] top-[18px] flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border text-[18px]"
            style={{
              borderColor: "rgba(103, 68, 196, 0.9)",
              background: "rgba(13, 22, 63, 0.92)",
              color: "#f5f7ff",
              boxShadow: "0 10px 18px rgba(7, 12, 34, 0.26)",
            }}
          >
            {"\u2715"}
          </button>
        </div>

        <div className="mt-[22px] grid grid-cols-[194px_minmax(0,1fr)] items-start gap-[24px] max-[560px]:grid-cols-1">
          <div className="flex flex-col gap-[14px]">
            <img
              src={previewAvatar}
              alt={`Аватар ${user?.username || "пользователя"}`}
              className="h-[194px] w-[194px] rounded-[34px] object-cover"
              style={{
                border: "1px solid rgba(113, 74, 216, 0.78)",
                background: "rgba(227, 230, 238, 0.96)",
                boxShadow: "0 24px 38px rgba(4, 10, 31, 0.34)",
              }}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-[8px] pr-[30px] max-[560px]:pr-0">
            <label className="flex flex-col gap-[8px]">
              <span
                className="text-[12px] uppercase tracking-[0.18em]"
                style={{ color: "#43e0ff", fontFamily: "var(--font-display)" }}
              >
                Никнейм
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(normalizeUsernameValue(event.target.value))
                }
                placeholder="Введите новый никнейм"
                className="h-[58px] rounded-[22px] border px-[22px] text-[18px] font-semibold outline-none"
                maxLength={USERNAME_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  borderColor: "rgba(103, 68, 196, 0.9)",
                  background: "rgba(8, 17, 49, 0.98)",
                  color: "#ffffff",
                  boxShadow: "inset 0 0 0 1px rgba(47, 193, 255, 0.05)",
                }}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="rounded-[16px] border px-[16px] py-[14px] text-[16px] outline-none file:mr-[12px] file:rounded-[12px] file:border-0 file:px-[12px] file:py-[8px] file:text-[13px] file:font-semibold"
                style={{
                  borderColor: "var(--modal-chip-border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--color-text)",
                }}
              />
            </label>

            {avatarFile ? (
              <div
                className="text-[13px] leading-[1.6]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Выбран файл: {avatarFile.name}
              </div>
            ) : null}

          </div>
        </div>

        {combinedErrorMessage ? (
          <div
            className="mt-[16px] rounded-[18px] border px-[16px] py-[12px] text-[14px]"
            style={{
              borderColor: "rgba(255, 118, 138, 0.4)",
              background: "rgba(87, 20, 36, 0.42)",
              color: "#ffd4db",
            }}
          >
            {combinedErrorMessage}
          </div>
        ) : null}

        <div className="mt-[24px] flex flex-wrap gap-[12px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[18px] border px-[22px] py-[13px] text-[16px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "rgba(103, 68, 196, 0.9)",
              background: "rgba(13, 22, 63, 0.98)",
              color: "#ffffff",
            }}
          >
            {isSubmitting ? "Сохраняем..." : "Сохранить изменения"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[18px] border px-[18px] py-[13px] text-[15px] font-semibold transition hover:brightness-110"
            style={{
              borderColor: "rgba(103, 68, 196, 0.72)",
              background: "rgba(10, 19, 54, 0.76)",
              color: "rgba(236, 241, 255, 0.92)",
            }}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function HistoryCard({
  entry,
  currentUserId,
  currentUsername,
  selectedPieceSkinId,
  selectedBoardSkinId,
  onOpen,
}) {
  const statusMeta = resolveStatusMeta(entry, currentUserId);
  const opponentName =
    entry.opponent?.username ||
    (entry.status === "active" ? "Ожидание соперника" : "Соперник неизвестен");
  const timeControl = resolveTimeControlConfig({
    time_control_id: entry.timeControlId,
  });

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="group rounded-tl-[24px] rounded-br-[24px] border p-[10px] text-left transition duration-200 hover:-translate-y-[1px] hover:border-[#3aa7ff] hover:brightness-[1.03]"
      style={chipStyle()}
    >
      <div className="grid grid-cols-[198px_minmax(0,1fr)] items-start gap-[18px]">
        <div className="shrink-0">
          <HistoryBoardPreview
            boardId={`profile-history-${entry.gameId}`}
            fen={entry.fen}
            boardOrientation={entry.youArePlayer1 ? "white" : "black"}
            pieceSkinId={selectedPieceSkinId}
            boardSkinId={selectedBoardSkinId}
            boardWidth={198}
          />
        </div>

        <div className="flex h-[198px] min-w-0 flex-col justify-between px-[4px] py-[2px]">
          <div className="min-w-0">
            <div className="mb-[10px] flex flex-wrap items-center gap-[6px]">
              <div
                className="m-0 block truncate text-[17px] leading-none font-semibold tracking-[-0.04em]"
                style={{ color: "#4051c9", fontFamily: "var(--font-display)" }}
              >
                {currentUsername}
              </div>
              <span
                className="text-[16px] font-semibold tracking-[-0.04em]"
                style={{ color: "#ff3df2" }}
              >
              </span>
            </div>

            <div
              className="mb-[10px] text-[28px] font-semibold leading-none"
              style={{ color: "#20c9ff", fontFamily: "var(--font-display)" }}
            >
              VS
            </div>

            <div className="mb-[10px] flex flex-wrap items-center gap-[6px]">
              <div
                className="m-0 block truncate text-[17px] leading-none font-semibold tracking-[-0.04em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {opponentName}
              </div>
              <span
                className="text-[16px] font-semibold tracking-[-0.04em]"
                style={{ color: "#ff3df2" }}
              >
              </span>
            </div>
          </div>

          <div className="grid gap-[6px] text-[12px] font-medium">
            <div>
              <span style={{ color: "#24c7ff" }}>Режим:</span>{" "}
              <span style={{ color: "#ff3df2" }}>
                {resolveGameModeLabel(entry.gameMode)}
              </span>
            </div>
            <div>
              <span style={{ color: "#68dfff" }}>Время:</span>{" "}
              <span style={{ color: "var(--color-text)" }}>
                {timeControl?.label || "Без лимита"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-[10px]">
            <div
              className="min-w-[98px] rounded-[10px] px-[12px] py-[8px] text-center text-[13px] font-semibold"
              style={{
                background:
                  statusMeta.tone === "active"
                    ? "linear-gradient(180deg, #d63c46 0%, #981723 100%)"
                    : statusMeta.tone === "success"
                      ? "linear-gradient(180deg, #20bf7d 0%, #167e54 100%)"
                      : statusMeta.tone === "danger"
                        ? "linear-gradient(180deg, #d5556a 0%, #8d1930 100%)"
                        : "linear-gradient(180deg, #495395 0%, #303a73 100%)",
              }}
            >
              {statusMeta.label}
            </div>

            <div className="flex items-center gap-[8px] text-[12px] font-semibold">
              <span>Депозит:</span>
              <div
                className="inline-flex items-center gap-[6px] rounded-[10px] border px-[10px] py-[5px]"
                style={{
                  borderColor: "rgba(52, 225, 255, 0.34)",
                  background: "rgba(7, 17, 49, 0.94)",
                  color: "#4fe6ff",
                }}
              >
                <img
                  src={ratingIcon}
                  alt=""
                  className="h-[14px] w-[14px] object-contain"
                />
                <span>{formatNumber(entry.betAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function InventoryCard({ item }) {
  const preview = resolveInventoryPreview(item);

  return (
    <article
      className="overflow-hidden rounded-tl-[18px] rounded-br-[18px] border"
      style={chipStyle()}
    >
      <div className="relative h-[156px]">
        <InventoryPreview item={item} />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6, 14, 40, 0.02) 20%, rgba(6, 14, 40, 0.12) 60%, rgba(6, 14, 40, 0.72) 100%)",
          }}
        />
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const { user, token, logout, refreshSession } = useAuth();
  const navigate = useReliableNavigate();
  const { ownedItems, selected, isInventoryLoading } = useInventory();
  const [historyEntries, setHistoryEntries] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryLoadingMore, setIsHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyNextOffset, setHistoryNextOffset] = useState(0);
  const [historyError, setHistoryError] = useState("");
  const [historyLoadMoreError, setHistoryLoadMoreError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const historyScrollRef = useRef(null);
  const historySentinelRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    if (typeof document !== "undefined") {
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    }
  }, []);

  const loadMoreHistory = useCallback(async () => {
    if (!token || isHistoryLoading || isHistoryLoadingMore || !historyHasMore) {
      return;
    }

    setIsHistoryLoadingMore(true);
    setHistoryLoadMoreError("");

    try {
      const response = await getMyGameHistory(token, {
        limit: HISTORY_PAGE_SIZE,
        offset: historyNextOffset,
      });

      setHistoryEntries((currentEntries) => {
        const existingIds = new Set(currentEntries.map((entry) => entry.gameId));
        const nextEntries = response.games.filter(
          (entry) => entry?.gameId && !existingIds.has(entry.gameId)
        );
        return [...currentEntries, ...nextEntries];
      });
      setHistoryHasMore(response.hasMore);
      setHistoryNextOffset(response.nextOffset);
    } catch (error) {
      setHistoryLoadMoreError(
        error?.message || "Не удалось загрузить ещё партии."
      );
    } finally {
      setIsHistoryLoadingMore(false);
    }
  }, [
    historyHasMore,
    historyNextOffset,
    isHistoryLoading,
    isHistoryLoadingMore,
    token,
  ]);

  useEffect(() => {
    let isCancelled = false;

    async function loadHistory() {
      if (!token) {
        setHistoryEntries([]);
        setIsHistoryLoading(false);
        setHistoryHasMore(false);
        setHistoryNextOffset(0);
        setHistoryLoadMoreError("");
        return;
      }

      setIsHistoryLoading(true);
      setHistoryError("");
      setHistoryLoadMoreError("");

      try {
        const response = await getMyGameHistory(token, {
          limit: HISTORY_PAGE_SIZE,
          offset: 0,
        });
        if (!isCancelled) {
          setHistoryEntries(response.games);
          setHistoryHasMore(response.hasMore);
          setHistoryNextOffset(response.nextOffset);
        }
      } catch (error) {
        if (!isCancelled) {
          setHistoryError(error?.message || "Не удалось загрузить историю игр.");
        }
      } finally {
        if (!isCancelled) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const root = historyScrollRef.current;
    const target = historySentinelRef.current;

    if (
      !root ||
      !target ||
      isHistoryLoading ||
      isHistoryLoadingMore ||
      !historyHasMore
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMoreHistory();
        }
      },
      {
        root,
        rootMargin: "160px 0px",
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    historyHasMore,
    historyEntries.length,
    isHistoryLoading,
    isHistoryLoadingMore,
    loadMoreHistory,
  ]);

  const selectedPieceSkinId =
    selected?.pieceSkinSlug || readStoredPieceSkin() || DEFAULT_PIECE_SKIN_SLUG;
  const selectedBoardSkinId =
    selected?.boardSkinSlug || readStoredBoardSkin() || DEFAULT_BOARD_SKIN_SLUG;

  const ownedPieceItems = useMemo(
    () =>
      ownedItems
        .filter(
          (item) => item?.slug && item.type === "piece_skin"
        )
        .sort((left, right) =>
          String(left?.title || left?.slug || "").localeCompare(
            String(right?.title || right?.slug || ""),
            "ru"
          )
        ),
    [ownedItems]
  );

  const featuredInventoryItems = useMemo(
    () => ownedPieceItems.slice(0, 3),
    [ownedPieceItems]
  );

  async function handleProfileSubmit(nextValues) {
    const nextUsername = String(nextValues?.username || "").trim();
    const currentUsername = String(user?.username || "").trim();
    const currentAvatarUrl = String(user?.avatar_url || "").trim();
    const nextAvatarFile = nextValues?.avatarFile || null;
    const shouldClearAvatar = Boolean(nextValues?.removeAvatar && currentAvatarUrl);
    const payload = {};
    const isUsernameChanged = nextUsername !== currentUsername;

    if (isUsernameChanged) {
      const usernameValidationError = validateUsername(nextUsername);
      if (usernameValidationError) {
        setProfileErrorMessage(usernameValidationError);
        return;
      }
    }

    if (nextUsername && isUsernameChanged) {
      payload.username = nextUsername;
    }

    if (shouldClearAvatar && !nextAvatarFile) {
      payload.clear_avatar_url = true;
    }

    if (Object.keys(payload).length === 0 && !nextAvatarFile) {
      setProfileErrorMessage("Нет изменений для сохранения.");
      return;
    }

    setIsSubmittingProfile(true);
    setProfileErrorMessage("");

    try {
      if (Object.keys(payload).length > 0) {
        await authApi.updateProfile(payload, token);
      }
      if (nextAvatarFile) {
        await authApi.uploadAvatar(nextAvatarFile, token);
      }
      await refreshSession(token);
      setIsEditModalOpen(false);
    } catch (error) {
      setProfileErrorMessage(error?.message || "Не удалось сохранить профиль.");
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  function openGame(entry) {
    if (!entry?.gameId) {
      return;
    }

    navigate(`/play?game=${encodeURIComponent(entry.gameId)}`);
  }

  const isMobile = useIsMobile();

  if (isMobile) {
    const fallbackImg = withAssetBase("/images/default-avatar.png");
    const avatarSrc = user?.avatar_url || fallbackImg;
    const username = user?.username || "Игрок";
    const level = user?.level || "—";
    const rank = user?.rank || "DungeonMaster III";
    const worldPosition = user?.world_position || "#—";
    const shopFunds = user?.shop_funds ?? 360;
    const gameFunds = user?.game_funds ?? 3228;
    const totalWins = user?.total_wins ?? 148;
    const totalLosses = user?.total_losses ?? 212;
    const totalGames = totalWins + totalLosses;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    const xpCurrent = user?.xp_current ?? 5720;
    const xpMax = user?.xp_max ?? 10000;
    const xpPercent = xpMax > 0 ? Math.min(100, Math.round((xpCurrent / xpMax) * 100)) : 0;
    const classicRating = user?.rating_classic ?? 1840;
    const rapidRating = user?.rating_rapid ?? 1720;
    const blitzRating = user?.rating_blitz ?? 1590;
    const classicChange = user?.rating_classic_change ?? "+24";
    const rapidChange = user?.rating_rapid_change ?? "+10";
    const blitzChange = user?.rating_blitz_change ?? "-8";

    return (
      <div className="mobile-page">
        <div className="mobile-page__topbar">
          <div className="mobile-page__topbar-left">
            <span className="mobile-page__topbar-logo">Pawn Requiem</span>
            <span className="mobile-page__topbar-sub">Meme Chess</span>
          </div>
        </div>

        <div className="mobile-page__currency-row">
          <div className="mobile-page__currency-pill mobile-page__currency-pill--gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>{shopFunds}</span>
          </div>
          <div className="mobile-page__currency-pill mobile-page__currency-pill--purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>{gameFunds}</span>
          </div>
        </div>

        <div className="mobile-page__content">
          <div className="profile-header">
            <div className="profile-header__avatar">
              <img src={avatarSrc} alt="" className="profile-header__avatar-img" />
              <div className="profile-header__level">{level} LVL</div>
            </div>
            <div className="profile-header__info">
              <h2 className="profile-header__name">{username}</h2>
              <p className="profile-header__rank">Ранг: <strong>{rank}</strong></p>
              <p className="profile-header__rank">{worldPosition} в мире</p>
            </div>
          </div>

          <div className="profile-xp">
            <div className="profile-xp__header">
              <span>XP</span>
              <span>{xpCurrent.toLocaleString("ru-RU")} / {xpMax.toLocaleString("ru-RU")}</span>
            </div>
            <div className="profile-xp__bar">
              <div className="profile-xp__fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          <div className="profile-currency-row">
            <div className="mobile-page__currency-pill mobile-page__currency-pill--gold" style={{ justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>{shopFunds}</span>
            </div>
            <div className="mobile-page__currency-pill mobile-page__currency-pill--purple" style={{ justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>{gameFunds}</span>
            </div>
          </div>

          <div className="profile-stats-grid">
            <div className="profile-stat-tile">
              <div className="profile-stat-tile__value">{totalWins}</div>
              <div className="profile-stat-tile__label">Победы</div>
            </div>
            <div className="profile-stat-tile">
              <div className="profile-stat-tile__value">{totalLosses}</div>
              <div className="profile-stat-tile__label">Поражения</div>
            </div>
            <div className="profile-stat-tile">
              <div className="profile-stat-tile__value">{winRate}%</div>
              <div className="profile-stat-tile__label">Винрейт</div>
            </div>
          </div>

          <div className="profile-rating-grid">
            <div className="profile-rating-tile">
              <div className="profile-rating-tile__mode">Классика</div>
              <div className="profile-rating-tile__value">{classicRating}</div>
              <div className="profile-rating-tile__change profile-rating-tile__change--up">▲{classicChange}</div>
            </div>
            <div className="profile-rating-tile">
              <div className="profile-rating-tile__mode">Рапид</div>
              <div className="profile-rating-tile__value">{rapidRating}</div>
              <div className="profile-rating-tile__change profile-rating-tile__change--up">▲{rapidChange}</div>
            </div>
            <div className="profile-rating-tile">
              <div className="profile-rating-tile__mode">Блиц</div>
              <div className="profile-rating-tile__value">{blitzRating}</div>
              <div className="profile-rating-tile__change profile-rating-tile__change--down">▼{blitzChange}</div>
            </div>
          </div>

          <div className="profile-last-games">
            <h3 className="profile-last-games__title">Последние партии</h3>
            {historyEntries.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                Пока нет сыгранных партий.
              </p>
            ) : (
              historyEntries.slice(0, 5).map((entry) => {
                const opponentName = entry.opponent?.username || "Соперник";
                const modeLabel = resolveGameModeLabel(entry.gameMode || entry.game_mode);
                const timeLabel = entry.timeControlLabel || "";
                const isWin = entry.winner_id === user?.id;
                return (
                  <button
                    key={entry.gameId}
                    type="button"
                    className="profile-history-card"
                    onClick={() => openGame(entry)}
                  >
                    <div className="profile-history-card__info">
                      <div className="profile-history-card__opponent">{opponentName}</div>
                      <div className="profile-history-card__meta">{modeLabel} · {timeLabel}</div>
                    </div>
                    <div className={`profile-history-card__result ${isWin ? "profile-history-card__result--win" : "profile-history-card__result--loss"}`}>
                      {isWin ? `+${entry.rating_change || ""}` : "Поражение"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <style>
        {`
          .profile-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(75, 230, 255, 0.82) rgba(8, 19, 52, 0.28);
          }

          .profile-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .profile-scroll::-webkit-scrollbar-track {
            background: rgba(8, 19, 52, 0.18);
            border-radius: 999px;
          }

          .profile-scroll::-webkit-scrollbar-thumb {
            border: 2px solid transparent;
            border-radius: 999px;
            background:
              linear-gradient(180deg, rgba(110, 74, 255, 0.95) 0%, rgba(75, 230, 255, 0.95) 100%);
            background-clip: padding-box;
            box-shadow: 0 0 14px rgba(75, 230, 255, 0.22);
          }

          .profile-scroll::-webkit-scrollbar-thumb:hover {
            background:
              linear-gradient(180deg, rgba(137, 98, 255, 1) 0%, rgba(100, 241, 255, 1) 100%);
            background-clip: padding-box;
          }
        `}
      </style>

      <div className="flex h-full w-full overflow-hidden">
        <AppSidebar />

        <main className="flex h-full min-h-0 flex-1 overflow-hidden py-[12px] pl-[60px] pr-[12px]">
          <ResponsivePanelFrame
            baseWidth={1030}
            baseHeight={760}
            horizontalAlign="left"
          >
            <div className="flex h-full w-full flex-col gap-[14px]">
            <section
              className="w-full min-h-[154px] overflow-hidden rounded-tl-[24px] rounded-br-[24px] px-[20px] py-[18px]"
              style={cardStyle()}
            >
              <div className="flex h-full items-start justify-between gap-[18px]">
                <div className="flex min-w-0 flex-1 items-start gap-[18px]">
                  <img
                    src={user.avatar_url || fallbackAvatar}
                    alt={`Аватар ${user.username}`}
                    className="h-[114px] w-[114px] rounded-[18px] object-cover"
                    style={{
                      border: "1px solid rgba(255,255,255,0.18)",
                      boxShadow: "0 14px 28px rgba(0, 0, 0, 0.22)",
                    }}
                  />

                  <div className="flex h-[114px] min-w-0 flex-1 flex-col justify-between py-[2px]">
                    <div
                      className="m-0 block truncate text-[23px] leading-none font-semibold tracking-[-0.04em]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {user.username}
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-[6px] text-[13px] font-medium"
                      style={{ color: "rgba(255,255,255,0.76)" }}
                    >
                      <span style={{ color: "#b1c7ff" }}>Дата регистрации:</span>
                      <span>{formatDate(user.created_at, { shortMonth: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-[8px]">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileErrorMessage("");
                      setIsEditModalOpen(true);
                    }}
                    className="rounded-[14px] px-[20px] py-[11px] text-[13px] font-semibold text-white transition hover:brightness-110"
                    style={{
                      background: "rgba(7, 15, 42, 0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
                    }}
                  >
                    Редактировать профиль
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex h-[32px] w-fit items-center justify-center rounded-[12px] border px-[12px] text-[12px] font-semibold transition hover:brightness-110"
                    style={{
                      borderColor: "var(--sidebar-secondary-button-border)",
                      background: "var(--sidebar-secondary-button-bg)",
                      color: "var(--sidebar-secondary-button-text)",
                    }}
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </section>

            <section className="grid h-0 min-h-0 flex-1 grid-cols-[700px_308px] gap-[22px] overflow-hidden">
              <div
                className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-tl-[24px] rounded-br-[24px] px-[10px] py-[18px]"
                style={panelStyle()}
              >
                <SectionTitle className="pl-[10px]">История игр:</SectionTitle>

                <div className="mt-[8px] flex min-h-0 flex-1 flex-col gap-[14px] overflow-hidden">
                  {isHistoryLoading ? (
                    <SurfaceNote>Загружаем историю ваших партий...</SurfaceNote>
                  ) : null}

                  {!isHistoryLoading && historyError ? (
                    <SurfaceNote>{historyError}</SurfaceNote>
                  ) : null}

                  {!isHistoryLoading && !historyError && historyEntries.length === 0 ? (
                    <SurfaceNote>
                      Пока нет сыгранных партий. Как только появятся матчи, они
                      будут показаны здесь.
                    </SurfaceNote>
                  ) : null}

                  {!isHistoryLoading && !historyError && historyEntries.length > 0 ? (
                    <div
                      ref={historyScrollRef}
                      className="profile-scroll h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-[4px]"
                    >
                      <div className="flex flex-col gap-[12px]">
                        {historyEntries.map((entry) => (
                          <HistoryCard
                            key={entry.gameId}
                            entry={entry}
                            currentUserId={user.id}
                            currentUsername={user.username}
                            selectedPieceSkinId={selectedPieceSkinId}
                            selectedBoardSkinId={selectedBoardSkinId}
                            onOpen={openGame}
                          />
                        ))}
                        {historyLoadMoreError ? (
                          <SurfaceNote>{historyLoadMoreError}</SurfaceNote>
                        ) : null}
                        {isHistoryLoadingMore ? (
                          <SurfaceNote>Загружаем ещё партии...</SurfaceNote>
                        ) : null}
                        {historyHasMore ? (
                          <div
                            ref={historySentinelRef}
                            className="h-[1px] w-full"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-tl-[24px] rounded-br-[24px] px-[18px] py-[18px]"
                style={panelStyle()}
              >
                <SectionTitle>Инвентарь:</SectionTitle>

                <div className="mt-[14px] flex min-h-0 flex-1 flex-col gap-[12px] overflow-hidden">
                  {isInventoryLoading ? (
                    <SurfaceNote>Загружаем предметы профиля...</SurfaceNote>
                  ) : null}

                  {!isInventoryLoading && featuredInventoryItems.length === 0 ? (
                    <SurfaceNote>
                      Пока здесь пусто. После покупок фигуры появятся в этом
                      списке.
                    </SurfaceNote>
                  ) : null}

                  {!isInventoryLoading ? (
                    <div className="profile-scroll h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-[2px]">
                      <div className="flex flex-col gap-[12px]">
                        {featuredInventoryItems.map((item) => (
                          <InventoryCard key={item.slug} item={item} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
            </div>
          </ResponsivePanelFrame>
        </main>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        user={user}
        isSubmitting={isSubmittingProfile}
        errorMessage={profileErrorMessage}
        onClose={() => {
          if (isSubmittingProfile) {
            return;
          }
          setIsEditModalOpen(false);
          setProfileErrorMessage("");
        }}
        onSubmit={handleProfileSubmit}
      />
    </div>
  );
}
