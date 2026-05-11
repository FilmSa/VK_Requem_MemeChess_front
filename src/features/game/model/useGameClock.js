import { useEffect, useMemo, useRef, useState } from "react";
import { declareTimeoutLoss } from "../gameApi.js";
import { resolveTimeControlConfig } from "./timeControl.js";

const CLOCK_TICK_MS = 250;
const WARNING_THRESHOLD_MS = 3 * 60 * 1000;
const DANGER_THRESHOLD_MS = 60 * 1000;

function isTimedRoom(roomState, fallbackTimeControl = {}) {
  return resolveTimeControlConfig(roomState, fallbackTimeControl).timed;
}

function getBaseRemainingMs(roomState, fallbackTimeControl = {}) {
  return resolveTimeControlConfig(roomState, fallbackTimeControl).baseMs;
}

function getStoredRemainingMs(roomState, playerId, fallbackTimeControl = {}) {
  const baseRemainingMs = getBaseRemainingMs(roomState, fallbackTimeControl);
  if (!roomState) {
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

function getEffectiveRemainingMs(
  roomState,
  playerId,
  nowMs,
  fallbackTimeControl = {}
) {
  const storedRemainingMs = Math.max(
    0,
    getStoredRemainingMs(roomState, playerId, fallbackTimeControl)
  );

  if (
    !isTimedRoom(roomState, fallbackTimeControl) ||
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

function hasRunningClock(roomState, timed) {
  if (!timed) {
    return false;
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
  fallbackTimeControl = null,
  currentUserId,
  opponentUserId,
  sessionToken,
  isOnlineGame = false,
  isLocalBotGame = false,
  onTimeoutResolved,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timeoutAttemptKeyRef = useRef("");

  const resolvedFallbackTimeControl = useMemo(
    () =>
      typeof fallbackTimeControl === "string"
        ? { time_control_id: fallbackTimeControl }
        : fallbackTimeControl || {},
    [fallbackTimeControl]
  );
  const resolvedTimeControl = useMemo(
    () => resolveTimeControlConfig(roomState, resolvedFallbackTimeControl),
    [resolvedFallbackTimeControl, roomState]
  );
  const timed = Boolean(resolvedTimeControl.timed && resolvedTimeControl.baseMs > 0);
  const gameStatus = String(roomState?.status || "").trim().toLowerCase();
  const clockRunning = hasRunningClock(roomState, timed);

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
      resolvedTimeControl
    );
    const topRemainingMs = getEffectiveRemainingMs(
      roomState,
      opponentUserId,
      nowMs,
      resolvedTimeControl
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
    nowMs,
    opponentUserId,
    roomState,
    resolvedTimeControl,
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
