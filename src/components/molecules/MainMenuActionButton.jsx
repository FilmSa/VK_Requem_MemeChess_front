import ButtonBase from "../atoms/ButtonBase.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function MainMenuActionButton({
  label,
  icon,
  backgroundClassName = "",
  backgroundStyle,
  className = "",
  onClick,
  disabled = false,
}) {
  const isMobile = useIsMobile();

  const actionTextStyle = {
    color: "#ffffff",
    fontSize: isMobile ? 16 : 27,
    fontWeight: 500,
    fontFamily: '"Unbounded", sans-serif',
  };

  const baseClass = isMobile
    ? "flex items-center justify-between rounded-br-[20px] rounded-tl-[20px] border-none px-[14px] py-[7px]"
    : "flex items-center justify-between rounded-br-[20px] rounded-tl-[20px] border-none px-[20px] py-[10px]";

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:-translate-y-[2px] focus-visible:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:focus-visible:translate-y-0 ${backgroundClassName} ${className}`}
      style={backgroundStyle}
    >
      <Text style={actionTextStyle}>{label}</Text>
      <Icon
        src={icon}
        alt=""
        className="object-contain"
        width={isMobile ? 39 : 49}
        height={isMobile ? 39 : 49}
      />
    </ButtonBase>
  );
}