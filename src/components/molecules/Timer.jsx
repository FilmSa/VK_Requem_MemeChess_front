import Badge from "../atoms/Badge";
import Text from "../atoms/Text";

export default function Timer({ time = "15:00", className = "" }) {
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
        boxShadow: "var(--player-timer-shadow)",
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
