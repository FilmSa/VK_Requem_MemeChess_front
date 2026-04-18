import arrowIcon from "../../../icons/arrow.svg";
import ButtonBase from "../atoms/ButtonBase.jsx";
import FieldLabel from "../atoms/FieldLabel.jsx";
import Icon from "../atoms/Icon.jsx";
import Text from "../atoms/Text.jsx";

const valueStyle = {
  color: "var(--main-menu-text)",
  fontSize: 30,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

const optionStyle = {
  color: "var(--main-menu-text)",
  fontSize: 20,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

export default function MainMenuSelectField({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}) {
  return (
    <div className="relative flex items-center justify-between px-[10px] py-[8px]">
      <FieldLabel>{label}</FieldLabel>

      <div className="relative">
        <ButtonBase
          onClick={onToggle}
          className="flex h-[61px] min-w-[225px] items-center justify-between rounded-[15px] border-none px-[16px]"
          style={{
            background: "var(--main-menu-control-bg)",
            boxShadow: "var(--main-menu-surface-shadow)",
          }}
        >
          <Text style={valueStyle}>{value}</Text>
          <Icon
            src={arrowIcon}
            alt=""
            className={`h-[50px] w-[50px] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{ filter: "var(--main-menu-icon-filter)" }}
          />
        </ButtonBase>

        {isOpen ? (
          <div
            className="absolute right-0 top-[68px] z-20 flex min-w-full flex-col overflow-hidden rounded-[15px]"
            style={{
              background: "var(--main-menu-control-bg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {options.map((option) => (
              <ButtonBase
                key={option}
                onClick={() => onSelect(option)}
                className="border-none px-4 py-3 text-left"
                style={{
                  ...optionStyle,
                  background:
                    option === value ? "var(--main-menu-tab-inactive-bg)" : "transparent",
                }}
              >
                {option}
              </ButtonBase>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
