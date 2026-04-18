import ButtonBase from "./ButtonBase.jsx";
import Icon from "./Icon.jsx";

export default function IconButton({
  iconSrc = "/icons/right.svg",
  label = "Toggle section",
  isExpanded = false,
  className = "",
  onClick,
}) {
  return (
    <ButtonBase
      type="button"
      aria-label={label}
      aria-expanded={isExpanded}
      onClick={onClick}
      className={`flex h-[60px] w-[42px] items-center justify-center border-none bg-transparent p-0 ${className}`}
    >
      <Icon
        src={iconSrc}
        alt=""
        width={29}
        height={16}
        style={{
          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.22s ease",
        }}
      />
    </ButtonBase>
  );
}
