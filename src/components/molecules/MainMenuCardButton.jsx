import ButtonBase from "../atoms/ButtonBase.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";

const radiusClasses = [
  "rounded-br-[35px] rounded-tl-[35px]",
  "rounded-bl-[35px] rounded-tr-[35px]",
  "rounded-bl-[35px] rounded-tr-[35px]",
  "rounded-br-[35px] rounded-tl-[35px]",
];

const cardTextStyle = {
  color: "#ffffff",
  fontSize: 31,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

export default function MainMenuCardButton({
  title,
  time,
  icon,
  background,
  isSelected,
  index,
  onClick,
}) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={isSelected}
      className={`relative flex items-center justify-center overflow-hidden border-none p-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:-translate-y-[2px] focus-visible:-translate-y-[2px] ${
        radiusClasses[index] || radiusClasses[0]
      }`}
      style={{
        background,
        boxShadow: isSelected
          ? "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25), inset 0 0 0 4px var(--main-menu-card-ring)"
          : "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex w-full items-center justify-center gap-[10px]">
        <div className="w-[138px] text-left leading-[1.05]">
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
          width={78}
          height={78}
        />
      </div>
    </ButtonBase>
  );
}
