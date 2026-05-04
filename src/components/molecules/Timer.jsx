import Badge from "../atoms/Badge";
import Text from "../atoms/Text";

const TIMER_OUTLINE_BY_TONE = {
  idle: "transparent",
  active: "#39d98a",
  warning: "#ff9f43",
  danger: "#ff5a5f",
};

export default function Timer({
  time = "15:00",
  className = "",
  isActive = false,
  tone = "idle",
}) {
  const outlineColor = isActive
    ? TIMER_OUTLINE_BY_TONE[tone] || TIMER_OUTLINE_BY_TONE.active
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
        boxShadow: `${isActive ? `0 0 0 2px ${outlineColor}, ` : ""}var(--player-timer-shadow)`,
      }}
    >
      <Text
        className="text-[22px] leading-none font-medium"
        style={{
          fontFamily: '"Unbounded", sans-serif',
          color: "var(--player-timer-text)",
        }}
      >
        {time}
      </Text>
    </Badge>
  );
}
