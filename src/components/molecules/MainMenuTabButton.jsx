import ButtonBase from "../atoms/ButtonBase.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";

const tabTextStyle = {
  color: "var(--main-menu-text)",
  fontSize: 20,
  fontWeight: 400,
  fontFamily: '"Unbounded", sans-serif',
};

export default function MainMenuTabButton({
  label,
  icon,
  isActive,
  isRightTab,
  onClick,
}) {
  return (
    <ButtonBase
      onClick={onClick}
      className={`relative flex h-[80px] flex-1 items-center justify-center gap-[10px] border-none px-[14px] ${
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
        width={isRightTab ? 24 : 30}
        height={isRightTab ? 24 : 30}
      />
    </ButtonBase>
  );
}
