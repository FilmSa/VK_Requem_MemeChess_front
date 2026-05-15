import { useEffect, useMemo, useState } from "react";
import Badge from "../atoms/Badge";
import Text from "../atoms/Text";

const TIMER_OUTLINE_BY_TONE = {
  idle: "transparent",
  active: "#39d98a",
  warning: "#ff9f43",
  danger: "#ff5a5f",
};
const TIMER_WARNING_THRESHOLD_MS = 3 * 60 * 1000;
const TIMER_DANGER_THRESHOLD_MS = 60 * 1000;

function formatClockDisplay(remainingMs, isTimed) {
  if (!isTimed) {
    return "∞";
  }

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveLiveTone(remainingMs, isActive, isTimed) {
  if (!isTimed || !isActive) {
    return "idle";
  }

  if (remainingMs <= TIMER_DANGER_THRESHOLD_MS) {
    return "danger";
  }

  if (remainingMs <= TIMER_WARNING_THRESHOLD_MS) {
    return "warning";
  }

  return "active";
}

export default function Timer({
  timer = null,
  time = "15:00",
  className = "",
  isActive = false,
  tone = "idle",
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timerIsTimed = Boolean(timer?.isTimed);
  const timerIsActive = Boolean(timer?.isActive ?? isActive);
  const hasLiveRemainingMs = Number.isFinite(timer?.remainingMs);
  const startedAtMs = Number(timer?.startedAtMs);

  useEffect(() => {
    if (!timerIsTimed || !timerIsActive || !Number.isFinite(startedAtMs)) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [startedAtMs, timerIsActive, timerIsTimed]);

  const resolvedRemainingMs = useMemo(() => {
    if (!hasLiveRemainingMs) {
      return null;
    }

    if (!timerIsTimed || !timerIsActive || !Number.isFinite(startedAtMs)) {
      return Math.max(0, timer.remainingMs);
    }

    return Math.max(0, timer.remainingMs - Math.max(0, nowMs - startedAtMs));
  }, [
    hasLiveRemainingMs,
    nowMs,
    startedAtMs,
    timer,
    timerIsActive,
    timerIsTimed,
  ]);

  const displayTime =
    resolvedRemainingMs !== null
      ? formatClockDisplay(resolvedRemainingMs, timerIsTimed)
      : timer?.displayTime || time;
  const resolvedTone =
    resolvedRemainingMs !== null
      ? resolveLiveTone(resolvedRemainingMs, timerIsActive, timerIsTimed)
      : tone;
  const outlineColor = timerIsActive
    ? TIMER_OUTLINE_BY_TONE[resolvedTone] || TIMER_OUTLINE_BY_TONE.active
    : TIMER_OUTLINE_BY_TONE.idle;

  return (
    <Badge
      className={`
        w-[150px]
        h-[44px]
        rounded-[20px_0px]
        flex
        items-center
        justify-center
        ${className}
      `}
      style={{
        background: "var(--player-timer-bg)",
        boxShadow: `${timerIsActive ? `0 0 0 2px ${outlineColor}, ` : ""}var(--player-timer-shadow)`,
      }}
    >
      <Text
        className="text-[22px] leading-none font-medium"
        style={{
          fontFamily: '"Unbounded", sans-serif',
          color: "var(--player-timer-text)",
        }}
      >
        {displayTime}
      </Text>
    </Badge>
  );
}
