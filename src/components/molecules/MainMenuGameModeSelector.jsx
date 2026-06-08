import classicIcon from "../../../icons/gameModeClassic.svg";
import fisherIcon from "../../../icons/gameModeFisher.svg";
import evolutionIcon from "../../../icons/gameModeEvolution.svg";
import ButtonBase from "../atoms/ButtonBase.jsx";
import FieldLabel from "../atoms/FieldLabel.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const MODE_CONFIG = {
  Классика: { icon: classicIcon, border: "#84DAE9" },
  Фишер: { icon: fisherIcon, border: "#FF00C8" },
  Эволюция: { icon: evolutionIcon, border: "#16CEEF" },
};

const MODE_ORDER = ["Классика", "Фишер", "Эволюция"];

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
    gap: isMobile ? 8 : 12,
  };

  const rowStyle = {
    display: "flex",
    gap: isMobile ? 6 : 10,
  };

  const buttonBaseStyle = {
    flex: 1,
    height: 120,
    borderRadius: 16,
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? 6 : 10,
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
            <ButtonBase
              key={mode}
              disabled={disabled}
              onClick={() => onSelect(mode)}
              style={{
                ...buttonBaseStyle,
                borderColor: config.border,
                background: isActive
                  ? "linear-gradient(180deg, #5238C8 0%, #342676 100%)"
                  : "#1A2B51",
              }}
            >
              <img
                src={config.icon}
                alt={mode}
                style={{ width: 48, height: 48, flexShrink: 0 }}
              />
              <span style={labelStyle}>{mode}</span>
            </ButtonBase>
          );
        })}
      </div>
    </div>
  );
}