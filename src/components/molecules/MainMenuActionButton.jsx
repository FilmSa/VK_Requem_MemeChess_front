import ButtonBase from "../atoms/ButtonBase.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";

const actionTextStyle = {
  color: "#ffffff",
  fontSize: 27,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

export default function MainMenuActionButton({
  label,
  icon,
  backgroundClassName = "",
  backgroundStyle,
  className = "",
  onClick,
  disabled = false,
}) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-br-[20px] rounded-tl-[20px] border-none px-[20px] py-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-70 ${backgroundClassName} ${className}`}
      style={backgroundStyle}
    >
      <Text style={actionTextStyle}>{label}</Text>
      <Icon
        src={icon}
        alt=""
        className="object-contain"
        width={49}
        height={49}
      />
    </ButtonBase>
  );
}
