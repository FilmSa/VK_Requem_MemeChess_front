import { useEffect, useMemo, useRef, useState } from "react";
import { declareTimeoutLoss } from "../gameApi.js";

const CLOCK_TICK_MS = 250;
const OPENING_MOVE_WINDOW_MS = 30 * 1000;
const WARNING_THRESHOLD_MS = 3 * 60 * 1000;
const DANGER_THRESHOLD_MS = 60 * 1000;
const OPENING_CLOCK_STORAGE_KEY_PREFIX = "meme-chess.opening-clock";

function resolveTimeControlId(roomState, fallbackTimeControlId = "") {
  const fallbackId = String(fallbackTimeControlId || "").trim().toLowerCase();
  if (!roomState || typeof roomState !== "object") {
    return fallbackId;
  }

  const roomTimeControlId = String(roomState.time_control_id ?? "")
    .trim()
    .toLowerCase();
  if (roomTimeControlId) {
    return roomTimeControlId;
  }

  const configuredBaseMs = Number(roomState.time_control_base_ms);
  if (Number.isFinite(configuredBaseMs) && configuredBaseMs > 0) {
    return fallbackId || "timed";
  }

  return fallbackId || "unlimited";
}

function isTimedRoom(roomState, fallbackTimeControlId = "") {
  const timeControlId = resolveTimeControlId(roomState, fallbackTimeControlId);

  return Boolean(timeControlId && timeControlId !== "unlimited");
}

function getBaseRemainingMs(roomState, fallbackTimeControlId = "") {
  const configuredBaseMs = Number(roomState?.time_control_base_ms);
  if (Number.isFinite(configuredBaseMs) && configuredBaseMs > 0) {
    return configuredBaseMs;
  }

  switch (resolveTimeControlId(roomState, fallbackTimeControlId)) {
    case "classic":
      return 30 * 60 * 1000;
    case "rapid":
      return 15 * 60 * 1000;
    case "blitz":
      return 3 * 60 * 1000;
    case "bullet":
      return 60 * 1000;
    default:
      return 0;
  }
}

function getStoredRemainingMs(roomState, playerId, fallbackTimeControlId = "") {
  const baseRemainingMs = getBaseRemainingMs(roomState, fallbackTimeControlId);
  if (!roomState) {
    return baseRemainingMs;
  }

  const hasStartedClock = Number.isFinite(
    Date.parse(roomState?.current_turn_started_at || "")
  );
  const isPreClockOpening =
    isTimedRoom(roomState, fallbackTimeControlId) &&
    roomState?.status === "active" &&
    !hasStartedClock &&
    Number(roomState?.moves?.length || 0) < 2;

  if (isPreClockOpening && baseRemainingMs > 0) {
    return baseRemainingMs;
  }

  const resolveRemaining = (value) => {
    if (value === null || value === undefined || value === "") {
      return baseRemainingMs;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return baseRemainingMs;
    }

    if (isPreClockOpening && numericValue <= 0 && baseRemainingMs > 0) {
      return baseRemainingMs;
    }

    return Math.max(0, numericValue);
  };

  if (!playerId) {
    return baseRemainingMs;
  }

  if (playerId === roomState.player1_id) {
    return resolveRemaining(roomState.player1_remaining_ms);
  }

  if (playerId === roomState.player2_id) {
    return resolveRemaining(roomState.player2_remaining_ms);
  }

  return baseRemainingMs;
}

function getOpeningTurnIndex(roomState, fallbackTimeControlId = "") {
  if (
    !isTimedRoom(roomState, fallbackTimeControlId) ||
    roomState?.status !== "active" ||
    Number.isFinite(Date.parse(roomState?.current_turn_started_at || ""))
  ) {
    return -1;
  }

  const moveCount = Array.isArray(roomState?.moves) ? roomState.moves.length : 0;
  return moveCount < 2 ? moveCount : -1;
}

function buildOpeningClockStorageKey(gameId, turnIndex) {
  return `${OPENING_CLOCK_STORAGE_KEY_PREFIX}.${String(gameId || "").trim()}.${turnIndex}`;
}

function readStoredOpeningTurnStartMs(gameId, turnIndex) {
  if (typeof window === "undefined" || !gameId || turnIndex < 0) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      buildOpeningClockStorageKey(gameId, turnIndex)
    );
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function writeStoredOpeningTurnStartMs(gameId, turnIndex, startedAtMs) {
  if (typeof window === "undefined" || !gameId || turnIndex < 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      buildOpeningClockStorageKey(gameId, turnIndex),
      String(startedAtMs)
    );
  } catch {
    // Ignore storage access failures and keep the timer only in memory.
  }
}

function clearStoredOpeningTurnStartMs(gameId) {
  if (typeof window === "undefined" || !gameId) {
    return;
  }

  try {
    window.sessionStorage.removeItem(buildOpeningClockStorageKey(gameId, 0));
    window.sessionStorage.removeItem(buildOpeningClockStorageKey(gameId, 1));
  } catch {
    // Ignore storage cleanup failures.
  }
}

function getEffectiveRemainingMs(
  roomState,
  playerId,
  nowMs,
  fallbackTimeControlId = "",
  openingTurnIndex = -1,
  openingTurnStartMs = null
) {
  const storedRemainingMs = Math.max(
    0,
    getStoredRemainingMs(roomState, playerId, fallbackTimeControlId)
  );

  if (
    openingTurnIndex >= 0 &&
    roomState?.current_turn_user_id === playerId &&
    Number.isFinite(openingTurnStartMs)
  ) {
    return Math.max(
      0,
      OPENING_MOVE_WINDOW_MS - Math.max(0, nowMs - openingTurnStartMs)
    );
  }

  if (
    !isTimedRoom(roomState, fallbackTimeControlId) ||
    roomState?.status !== "active" ||
    roomState?.current_turn_user_id !== playerId
  ) {
    return storedRemainingMs;
  }

  const startedAtMs = Date.parse(roomState?.current_turn_started_at || "");
  if (!Number.isFinite(startedAtMs)) {
    return storedRemainingMs;
  }

  return Math.max(0, storedRemainingMs - Math.max(0, nowMs - startedAtMs));
}

function hasRunningClock(roomState, timed, openingTurnIndex, openingTurnStartMs) {
  if (!timed) {
    return false;
  }

  if (openingTurnIndex >= 0 && Number.isFinite(openingTurnStartMs)) {
    return true;
  }

  return Number.isFinite(Date.parse(roomState?.current_turn_started_at || ""));
}

function formatClock(remainingMs, timed) {
  if (!timed) {
    return "в€ћ";
  }

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveTone(remainingMs, isActive, timed) {
  if (!timed || !isActive) {
    return "idle";
  }
  if (remainingMs <= DANGER_THRESHOLD_MS) {
    return "danger";
  }
  if (remainingMs <= WARNING_THRESHOLD_MS) {
    return "warning";
  }
  return "active";
}

export function useGameClock({
  gameId,
  roomState,
  fallbackTimeControlId = "",
  currentUserId,
  opponentUserId,
  sessionToken,
  isOnlineGame = false,
  isLocalBotGame = false,
  onTimeoutResolved,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [openingTurnStartMs, setOpeningTurnStartMs] = useState(null);
  const timeoutAttemptKeyRef = useRef("");

  const timed = isTimedRoom(roomState, fallbackTimeControlId);
  const gameStatus = String(roomState?.status || "").trim().toLowerCase();
  const openingTurnIndex = getOpeningTurnIndex(roomState, fallbackTimeControlId);
  const clockRunning = hasRunningClock(
    roomState,
    timed,
    openingTurnIndex,
    openingTurnStartMs
  );

  useEffect(() => {
    if (!gameId) {
      setOpeningTurnStartMs(null);
      return;
    }

    if (openingTurnIndex < 0 || gameStatus !== "active") {
      setOpeningTurnStartMs(null);

      if (gameStatus && gameStatus !== "active") {
        clearStoredOpeningTurnStartMs(gameId);
      }
      return;
    }

    const storedStartedAtMs = readStoredOpeningTurnStartMs(gameId, openingTurnIndex);
    if (Number.isFinite(storedStartedAtMs)) {
      setOpeningTurnStartMs(storedStartedAtMs);
      return;
    }

    const nextStartedAtMs = Date.now();
    writeStoredOpeningTurnStartMs(gameId, openingTurnIndex, nextStartedAtMs);
    setOpeningTurnStartMs(nextStartedAtMs);
  }, [gameId, gameStatus, openingTurnIndex]);

  useEffect(() => {
    if (!timed || gameStatus !== "active") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, CLOCK_TICK_MS);

    return () => window.clearInterval(timerId);
  }, [gameStatus, timed]);

  const playerClock = useMemo(() => {
    const bottomRemainingMs = getEffectiveRemainingMs(
      roomState,
      currentUserId,
      nowMs,
      fallbackTimeControlId,
      openingTurnIndex,
      openingTurnStartMs
    );
    const topRemainingMs = getEffectiveRemainingMs(
      roomState,
      opponentUserId,
      nowMs,
      fallbackTimeControlId,
      openingTurnIndex,
      openingTurnStartMs
    );
    const activePlayerId = String(roomState?.current_turn_user_id || "").trim();

    return {
      timed,
      clockRunning,
      activePlayerId,
      topRemainingMs,
      bottomRemainingMs,
      top: {
        time: formatClock(topRemainingMs, timed),
        isActive: clockRunning && activePlayerId === opponentUserId,
        tone: resolveTone(
          topRemainingMs,
          clockRunning && activePlayerId === opponentUserId,
          timed
        ),
      },
      bottom: {
        time: formatClock(bottomRemainingMs, timed),
        isActive: clockRunning && activePlayerId === currentUserId,
        tone: resolveTone(
          bottomRemainingMs,
          clockRunning && activePlayerId === currentUserId,
          timed
        ),
      },
    };
  }, [
    clockRunning,
    currentUserId,
    fallbackTimeControlId,
    nowMs,
    openingTurnIndex,
    openingTurnStartMs,
    opponentUserId,
    roomState,
    timed,
  ]);

  useEffect(() => {
    if (
      !isOnlineGame ||
      isLocalBotGame ||
      !timed ||
      !clockRunning ||
      !gameId ||
      !sessionToken ||
      gameStatus !== "active" ||
      !playerClock.activePlayerId
    ) {
      timeoutAttemptKeyRef.current = "";
      return;
    }

    const activeRemainingMs =
      playerClock.activePlayerId === currentUserId
        ? playerClock.bottomRemainingMs
        : playerClock.topRemainingMs;

    if (activeRemainingMs > 0) {
      timeoutAttemptKeyRef.current = "";
      return;
    }

    const timeoutKey = [
      gameId,
      playerClock.activePlayerId,
      openingTurnIndex,
      roomState?.current_turn_started_at || "",
      roomState?.moves?.length || 0,
    ].join(":");

    if (timeoutAttemptKeyRef.current === timeoutKey) {
      return;
    }

    timeoutAttemptKeyRef.current = timeoutKey;

    declareTimeoutLoss(gameId, sessionToken)
      .then((nextState) => {
        onTimeoutResolved?.(nextState);
      })
      .catch((error) => {
        if (
          error?.status === 409 &&
          String(error?.message || "")
            .toLowerCase()
            .includes("clock still running")
        ) {
          timeoutAttemptKeyRef.current = "";
        }
      });
  }, [
    currentUserId,
    gameId,
    gameStatus,
    clockRunning,
    isLocalBotGame,
    isOnlineGame,
    onTimeoutResolved,
    openingTurnIndex,
    playerClock.activePlayerId,
    playerClock.bottomRemainingMs,
    playerClock.topRemainingMs,
    roomState?.current_turn_started_at,
    roomState?.moves?.length,
    sessionToken,
    timed,
  ]);

  return playerClock;
}
