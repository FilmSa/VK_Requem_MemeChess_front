import Badge from "../atoms/Badge";
import Icon from "../atoms/Icon";
import Text from "../atoms/Text";

export default function CurrencyBadge({ icon, value, bgClass, borderClass, textClass }) {
  return (
    <Badge
      className={`
        w-[99px]
        h-[32px]
        px-[10px]
        border
        rounded-[14px_0px]
        flex
        items-center
        justify-center
        gap-[6px]
        ${bgClass}
        ${borderClass}
      `}
    >
      <Icon src={icon} className="w-[14px] h-[14px] object-contain" />
      <Text
        className={`text-[14px] font-medium leading-none ${textClass}`}
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {value}
      </Text>
    </Badge>
  );
}