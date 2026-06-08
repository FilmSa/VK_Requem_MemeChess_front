import { useEffect, useMemo, useRef } from "react";
import { declareTimeoutLoss } from "../gameApi.js";
import { resolveTimeControlConfig } from "./timeControl.js";

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

function hasRunningClock(roomState, timed, isGameFinished = false) {
  if (!timed || isGameFinished || roomState?.status !== "active") {
    return false;
  }

  return Number.isFinite(Date.parse(roomState?.current_turn_started_at || ""));
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

  if (remainingMs <= 60 * 1000) {
    return "danger";
  }

  if (remainingMs <= 3 * 60 * 1000) {
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
  isGameFinished = false,
  onTimeoutResolved,
}) {
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
  const clockRunning = hasRunningClock(roomState, timed, isGameFinished);

  const playerClock = useMemo(() => {
    const bottomRemainingMs = getStoredRemainingMs(
      roomState,
      currentUserId,
      resolvedTimeControl
    );
    const topRemainingMs = getStoredRemainingMs(
      roomState,
      opponentUserId,
      resolvedTimeControl
    );
    const activePlayerId = String(roomState?.current_turn_user_id || "").trim();
    const parsedStartedAtMs = Date.parse(roomState?.current_turn_started_at || "");
    const startedAtMs = Number.isFinite(parsedStartedAtMs)
      ? parsedStartedAtMs
      : null;
    const topIsActive = clockRunning && activePlayerId === opponentUserId;
    const bottomIsActive = clockRunning && activePlayerId === currentUserId;

    return {
      timed,
      clockRunning,
      activePlayerId,
      top: {
        displayTime: timed ? "" : "∞",
        isTimed: timed,
        remainingMs: topRemainingMs,
        startedAtMs: topIsActive ? startedAtMs : null,
        isActive: topIsActive,
        time: formatClock(topRemainingMs, timed),
        tone: resolveTone(topRemainingMs, topIsActive, timed),
      },
      bottom: {
        displayTime: timed ? "" : "∞",
        isTimed: timed,
        remainingMs: bottomRemainingMs,
        startedAtMs: bottomIsActive ? startedAtMs : null,
        isActive: bottomIsActive,
        time: formatClock(bottomRemainingMs, timed),
        tone: resolveTone(bottomRemainingMs, bottomIsActive, timed),
      },
    };
  }, [
    clockRunning,
    currentUserId,
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
      isGameFinished ||
      gameStatus !== "active" ||
      !playerClock.activePlayerId
    ) {
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

    const activeRemainingMs = getEffectiveRemainingMs(
      roomState,
      playerClock.activePlayerId,
      Date.now(),
      resolvedTimeControl
    );

    function attemptDeclareTimeout() {
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
    }

    if (activeRemainingMs <= 0) {
      attemptDeclareTimeout();
      return;
    }

    timeoutAttemptKeyRef.current = "";
    const timeoutId = window.setTimeout(
      attemptDeclareTimeout,
      activeRemainingMs + 50
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    clockRunning,
    gameId,
    gameStatus,
    isGameFinished,
    isLocalBotGame,
    isOnlineGame,
    onTimeoutResolved,
    playerClock.activePlayerId,
    resolvedTimeControl,
    roomState,
    roomState?.current_turn_started_at,
    roomState?.moves?.length,
    sessionToken,
    timed,
  ]);

  return playerClock;
}
