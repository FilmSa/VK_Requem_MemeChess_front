import Badge from "../atoms/Badge";
import Text from "../atoms/Text";

export default function Timer({ time = "15:00", className = "" }) {
  return (
    <Badge
      className={`
        w-[150px]
        h-[44px]
        rounded-[20px_0px]
        bg-[#070d34]
        shadow-[0_4px_10px_rgba(0,0,0,0.35)]
        flex
        items-center
        justify-center
        ${className}
      `}
    >
      <Text
        className="text-[22px] leading-none font-medium text-[#ffff]"
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {time}
      </Text>
    </Badge>
  );
}