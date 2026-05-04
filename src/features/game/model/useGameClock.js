import { useEffect, useMemo, useRef, useState } from "react";
import { declareTimeoutLoss } from "../gameApi.js";

const CLOCK_TICK_MS = 250;
const WARNING_THRESHOLD_MS = 3 * 60 * 1000;
const DANGER_THRESHOLD_MS = 60 * 1000;

function isTimedRoom(roomState) {
  const timeControlId = String(roomState?.time_control_id || "")
    .trim()
    .toLowerCase();

  return Boolean(timeControlId && timeControlId !== "unlimited");
}

function getBaseRemainingMs(roomState) {
  const configuredBaseMs = Number(roomState?.time_control_base_ms);
  if (Number.isFinite(configuredBaseMs) && configuredBaseMs > 0) {
    return configuredBaseMs;
  }

  switch (String(roomState?.time_control_id || "").trim().toLowerCase()) {
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

function getStoredRemainingMs(roomState, playerId) {
  if (!roomState) {
    return 0;
  }

  const baseRemainingMs = getBaseRemainingMs(roomState);
  const resolveRemaining = (value) => {
    if (value === null || value === undefined || value === "") {
      return baseRemainingMs;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.max(0, numericValue) : baseRemainingMs;
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

function getEffectiveRemainingMs(roomState, playerId, nowMs) {
  const storedRemainingMs = Math.max(0, getStoredRemainingMs(roomState, playerId));

  if (
    !isTimedRoom(roomState) ||
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

function formatClock(remainingMs, timed) {
  if (!timed) {
    return "∞";
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
  currentUserId,
  opponentUserId,
  sessionToken,
  isOnlineGame = false,
  isLocalBotGame = false,
  onTimeoutResolved,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timeoutAttemptKeyRef = useRef("");

  const timed = isTimedRoom(roomState);
  const gameStatus = String(roomState?.status || "").trim().toLowerCase();

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
    const bottomRemainingMs = getEffectiveRemainingMs(roomState, currentUserId, nowMs);
    const topRemainingMs = getEffectiveRemainingMs(roomState, opponentUserId, nowMs);
    const activePlayerId = String(roomState?.current_turn_user_id || "").trim();

    return {
      timed,
      activePlayerId,
      topRemainingMs,
      bottomRemainingMs,
      top: {
        time: formatClock(topRemainingMs, timed),
        isActive: timed && activePlayerId === opponentUserId,
        tone: resolveTone(topRemainingMs, activePlayerId === opponentUserId, timed),
      },
      bottom: {
        time: formatClock(bottomRemainingMs, timed),
        isActive: timed && activePlayerId === currentUserId,
        tone: resolveTone(bottomRemainingMs, activePlayerId === currentUserId, timed),
      },
    };
  }, [currentUserId, nowMs, opponentUserId, roomState, timed]);

  useEffect(() => {
    if (
      !isOnlineGame ||
      isLocalBotGame ||
      !timed ||
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
    isLocalBotGame,
    isOnlineGame,
    onTimeoutResolved,
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
