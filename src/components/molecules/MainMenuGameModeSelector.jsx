import classicIcon from "../../../icons/gameModeClassic.svg";
import fisherIcon from "../../../icons/gameModeFisher.svg";
import evolutionIcon from "../../../icons/gameModeEvolution.svg";
import ButtonBase from "../atoms/ButtonBase.jsx";
import DelayedTooltip from "../atoms/DelayedTooltip.jsx";
import FieldLabel from "../atoms/FieldLabel.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const MODE_CONFIG = {
  "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430": {
    icon: classicIcon,
    border: "#84DAE9",
    description:
      "\u041e\u0431\u044b\u0447\u043d\u044b\u0435 \u0448\u0430\u0445\u043c\u0430\u0442\u044b",
  },
  "\u0424\u0438\u0448\u0435\u0440": {
    icon: fisherIcon,
    border: "#FF00C8",
    description:
      "\u0428\u0430\u0445\u043c\u0430\u0442\u044b \u0432 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0432 \u0441\u043b\u0443\u0447\u0430\u0439\u043d\u043e\u043c \u043f\u043e\u0440\u044f\u0434\u043a\u0435 \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u044b \u0444\u0438\u0433\u0443\u0440\u044b \u043f\u0435\u0440\u0435\u0434 \u043f\u0435\u0448\u043a\u0430\u043c\u0438",
  },
  "\u042d\u0432\u043e\u043b\u044e\u0446\u0438\u044f": {
    icon: evolutionIcon,
    border: "#16CEEF",
    description:
      "\u0428\u0430\u0445\u043c\u0430\u0442\u044b \u0432 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u043f\u043e \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044e \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u043d\u043e\u0433\u043e \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0445\u043e\u0434\u043e\u0432 \u0444\u0438\u0433\u0443\u0440\u044b \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438",
  },
};

const MODE_ORDER = [
  "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430",
  "\u0424\u0438\u0448\u0435\u0440",
  "\u042d\u0432\u043e\u043b\u044e\u0446\u0438\u044f",
];

function resolveRgb(hexColor) {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return "82, 56, 200";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
}

function buildActiveBackground(hexColor) {
  const rgb = resolveRgb(hexColor);
  return `linear-gradient(180deg, rgba(${rgb}, 0.5) 0%, rgba(${rgb}, 0.24) 100%), #1A2B51`;
}

export default function MainMenuGameModeSelector({
  label,
  value,
  disabled = false,
  onSelect,
}) {
  const isMobile = useIsMobile();

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? 8 : 8,
  };

  const rowStyle = {
    display: "flex",
    gap: isMobile ? 6 : 10,
  };

  const buttonBaseStyle = {
    flex: 1,
    height: isMobile ? 96 : 98,
    borderRadius: 16,
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? 6 : 8,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    fontFamily: '"Unbounded", sans-serif',
  };

  const labelStyle = {
    color: "white",
    fontSize: isMobile ? 13 : 16,
    fontWeight: 500,
    fontFamily: '"Unbounded", sans-serif',
  };

  return (
    <div style={containerStyle}>
      <FieldLabel>{label}</FieldLabel>
      <div style={rowStyle}>
        {MODE_ORDER.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isActive = value === mode;

          return (
            <DelayedTooltip
              key={mode}
              content={config.description}
              disabled={disabled}
              style={{ flex: 1 }}
            >
              <ButtonBase
                disabled={disabled}
                onClick={() => onSelect(mode)}
                style={{
                  ...buttonBaseStyle,
                  width: "100%",
                  borderColor: config.border,
                  background: isActive
                    ? buildActiveBackground(config.border)
                    : "#1A2B51",
                }}
              >
                <img
                  src={config.icon}
                  alt={mode}
                  style={{
                    width: isMobile ? 40 : 44,
                    height: isMobile ? 40 : 44,
                    flexShrink: 0,
                  }}
                />
                <span style={labelStyle}>{mode}</span>
              </ButtonBase>
            </DelayedTooltip>
          );
        })}
      </div>
    </div>
  );
}
