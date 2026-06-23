import ButtonBase from "../atoms/ButtonBase.jsx";
import DelayedTooltip from "../atoms/DelayedTooltip.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const radiusClasses = [
  "rounded-br-[35px] rounded-tl-[35px]",
  "rounded-bl-[35px] rounded-tr-[35px]",
  "rounded-bl-[35px] rounded-tr-[35px]",
  "rounded-br-[35px] rounded-tl-[35px]",
];
const TIME_CONTROL_TOOLTIP =
  "\u041e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u043a\u0430\u043a\u043e\u0435 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435 \u043f\u043e \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0431\u0443\u0434\u0435\u0442 \u0443 \u043f\u0430\u0440\u0442\u0438\u0438.";

export default function MainMenuCardButton({
  title,
  time,
  icon,
  background,
  isSelected,
  index,
  onClick,
}) {
  const isMobile = useIsMobile();

  const cardTextStyle = {
    color: "#ffffff",
    fontSize: isMobile ? 16 : 28,
    fontWeight: 500,
    fontFamily: '"Unbounded", sans-serif',
  };

  return (
    <DelayedTooltip content={TIME_CONTROL_TOOLTIP} style={{ height: "100%" }}>
      <ButtonBase
        onClick={onClick}
        aria-pressed={isSelected}
        className={`relative flex items-center justify-center overflow-hidden border-none p-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:-translate-y-[2px] focus-visible:-translate-y-[2px] ${
          radiusClasses[index] || radiusClasses[0]
        }`}
        style={{
          width: "100%",
          height: "100%",
          background,
          boxShadow: isSelected
            ? "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25), inset 0 0 0 4px var(--main-menu-card-ring)"
            : "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <div className={`flex w-full items-center justify-center gap-[${isMobile ? "7" : "10"}px]`}>
          <div className={`${isMobile ? "w-[98px]" : "w-[138px]"} text-left leading-[1.05]`}>
            <Text className="block" style={cardTextStyle}>
              {title}
            </Text>
            <Text className="block" style={cardTextStyle}>
              {time}
            </Text>
          </div>

          <Icon
            src={icon}
            alt=""
            className="object-contain"
            width={isMobile ? 62 : 78}
            height={isMobile ? 62 : 78}
          />
        </div>
      </ButtonBase>
    </DelayedTooltip>
  );
}
