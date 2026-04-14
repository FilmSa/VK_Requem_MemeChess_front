import { useState } from "react";
import Icon from "../atoms/Icon";

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

  button: (variant, disabled) => {
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
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: disabled ? 0.6 : 1,
    };

    if (variant === "resign") {
      return {
        ...baseStyle,
        background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
      };
    }

    return {
      ...baseStyle,
      background: "linear-gradient(135deg, #d946ef 0%, #a91ba8 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.1)",
    };
  },

  buttonHover: (variant) => {
    if (variant === "resign") {
      return {
        background: "linear-gradient(135deg, #e53e50 0%, #a01020 100%)",
        boxShadow: "0 6px 16px rgba(196,30,58,0.4)",
      };
    }

    return {
      background: "linear-gradient(135deg, #e964ff 0%, #c81fd5 100%)",
      boxShadow: "0 6px 16px rgba(217,70,239,0.4)",
    };
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

export default function GameActionsMolecule({
  actions = GAME_ACTIONS,
  onResign = () => {},
  onDraw = () => {},
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = disabled || isLoading;

  async function handleResign() {
    setIsLoading(true);
    try {
      await onResign();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDrawOffer() {
    setIsLoading(true);
    try {
      await onDraw();
    } finally {
      setIsLoading(false);
    }
  }

  function handleMouseEnter(event, variant) {
    if (isDisabled) {
      return;
    }
    Object.assign(event.currentTarget.style, S.buttonHover(variant));
  }

  function handleMouseLeave(event, variant) {
    Object.assign(event.currentTarget.style, S.button(variant, isDisabled));
  }

  return (
    <div style={S.container}>
      <div style={S.row}>
        <button
          style={S.button(actions.resign.color, isDisabled)}
          onClick={handleResign}
          disabled={isDisabled}
          onMouseEnter={(event) => handleMouseEnter(event, actions.resign.color)}
          onMouseLeave={(event) => handleMouseLeave(event, actions.resign.color)}
          title={actions.resign.description}
        >
          <div style={S.iconWrapper}>
            <Icon iconKey={actions.resign.iconKey} width={16} height={16} />
          </div>
          {actions.resign.label}
        </button>
        <button
          style={S.button(actions.draw.color, isDisabled)}
          onClick={handleDrawOffer}
          disabled={isDisabled}
          onMouseEnter={(event) => handleMouseEnter(event, actions.draw.color)}
          onMouseLeave={(event) => handleMouseLeave(event, actions.draw.color)}
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

export { GAME_ACTIONS };
