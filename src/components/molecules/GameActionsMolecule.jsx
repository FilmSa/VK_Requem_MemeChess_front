import { useState } from "react";
import Icon from "../atoms/Icon";
import { useGameSocket } from "../../features/chess/hooks/useGameSocket";

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "8px 0",
  },

  row: {
    display: "flex",
    gap: 8,
  },

  button: (variant) => {
    const baseStyle = {
      flex: 1,
      padding: "10px 14px",
      border: "none",
      borderRadius: 8,
      fontFamily: "'Unbounded', sans-serif",
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    };

    if (variant === "resign") {
      return {
        ...baseStyle,
        background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
      };
    }

    if (variant === "draw") {
      return {
        ...baseStyle,
        background: "linear-gradient(135deg, #d946ef 0%, #a91ba8 100%)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
      };
    }

    return baseStyle;
  },

  buttonHover: (variant) => {
    if (variant === "resign") {
      return {
        background: "linear-gradient(135deg, #e53e50 0%, #a01020 100%)",
        boxShadow: "0 6px 16px rgba(196,30,58,0.4)",
      };
    }

    if (variant === "draw") {
      return {
        background: "linear-gradient(135deg, #e964ff 0%, #c81fd5 100%)",
        boxShadow: "0 6px 16px rgba(217,70,239,0.4)",
      };
    }

    return {};
  },

  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
  },
};


const GAME_ACTIONS = {
  resign: {
    id: "resign",
    label: "Сдаться",
    iconKey: "surrender",
    description: "Сдаться в партии",
    color: "resign",
  },
  draw: {
    id: "draw",
    label: "Ничья",
    iconKey: "draw",
    description: "Предложить ничью",
    color: "draw",
  },
};

export default function GameActionsMolecule({ actions = GAME_ACTIONS }) {
  const { sendResign, sendDraw } = useGameSocket({ onRemoteMove: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleResign = () => {
    // окно для подтверждения поражения
  };

  const handleDrawOffer = () => {
    setIsLoading(true);
    try {
      sendDraw();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = (e, variant) => {
    Object.assign(e.target.style, S.buttonHover(variant));
  };

  const handleMouseLeave = (e, variant) => {
    Object.assign(e.target.style, S.button(variant));
  };

  return (
    <div style={S.container}>
      <div style={S.row}>
        <button
          style={S.button(actions.resign.color)}
          onClick={handleResign}
          disabled={isLoading}
          onMouseEnter={(e) => handleMouseEnter(e, actions.resign.color)}
          onMouseLeave={(e) => handleMouseLeave(e, actions.resign.color)}
          title={actions.resign.description}
        >
          <div style={S.iconWrapper}>
            <Icon iconKey={actions.resign.iconKey} width={16} height={16} />
          </div>
          {actions.resign.label}
        </button>
        <button
          style={S.button(actions.draw.color)}
          onClick={handleDrawOffer}
          disabled={isLoading}
          onMouseEnter={(e) => handleMouseEnter(e, actions.draw.color)}
          onMouseLeave={(e) => handleMouseLeave(e, actions.draw.color)}
          title={actions.draw.description}
        >
          <div style={S.iconWrapper}>
            <Icon iconKey={actions.draw.iconKey} width={16} height={16} />
          </div>
          {actions.draw.label}
        </button>
      </div>
    </div>
  );
}

// Экспорт конфига для переиспользования
export { GAME_ACTIONS };

