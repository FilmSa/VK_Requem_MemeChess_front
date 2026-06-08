import ButtonBase from "../atoms/ButtonBase.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function MainMenuTabButton({
  label,
  icon,
  isActive,
  isRightTab,
  onClick,
}) {
  const isMobile = useIsMobile();

  const tabTextStyle = {
    color: "var(--main-menu-text)",
    fontSize: isMobile ? 16 : 20,
    fontWeight: 400,
    fontFamily: '"Unbounded", sans-serif',
  };

  const btnClass = isMobile
    ? "relative flex h-[68px] flex-1 items-center justify-center gap-[7px] border-none px-[10px]"
    : "relative flex h-[80px] flex-1 items-center justify-center gap-[10px] border-none px-[14px]";

  const activeRightClass = isRightTab ? "rounded-tl-[40px]" : !isActive ? "rounded-br-[40px]" : "";

  return (
    <ButtonBase
      onClick={onClick}
      className={`relative flex h-[80px] flex-1 items-center justify-center gap-[10px] border-none px-[14px] transition-transform duration-150 hover:-translate-y-[2px] focus-visible:-translate-y-[2px] ${
        isRightTab ? "rounded-tl-[40px]" : !isActive ? "rounded-br-[40px]" : ""
      }`}
      style={{
        background: isActive ? "transparent" : "var(--main-menu-tab-inactive-bg)",
        boxShadow: isActive ? "none" : "var(--main-menu-surface-shadow)",
      }}
    >
      <Text style={tabTextStyle}>{label}</Text>
      <Icon
        src={icon}
        alt=""
        className="object-contain"
        style={{ filter: "var(--main-menu-icon-filter)" }}
        width={isMobile ? (isRightTab ? 20 : 24) : (isRightTab ? 24 : 30)}
        height={isMobile ? (isRightTab ? 20 : 24) : (isRightTab ? 24 : 30)}
      />
    </ButtonBase>
  );
}