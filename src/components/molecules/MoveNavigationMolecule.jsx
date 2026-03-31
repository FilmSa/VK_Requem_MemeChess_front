const S = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 0",
  },
  
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    background: "#0a0f2e",
    border: "1px solid rgba(0,234,255,0.12)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 20,
    color: "rgba(0,234,255,0.6)",
    fontWeight: "bold",
    transition: "all 0.2s ease",
    fontFamily: "'Unbounded', sans-serif",
  },
  
  buttonHover: {
    background: "rgba(0,234,255,0.1)",
    borderColor: "rgba(0,234,255,0.3)",
    color: "#00eaff",
    boxShadow: "0 0 8px rgba(0,234,255,0.2)",
  },
};

export default function MoveNavigationMolecule({ onPrevious, onNext, disabled = false }) {
  const handleMouseEnter = (e) => {
    if (!disabled) {
      Object.assign(e.target.style, S.buttonHover);
    }
  };

  const handleMouseLeave = (e) => {
    Object.assign(e.target.style, {
      background: S.button.background,
      borderColor: S.button.border,
      color: S.button.color,
      boxShadow: S.button.boxShadow,
    });
  };

  return (
    <div style={S.container}>
      <button
        style={S.button}
        onClick={onPrevious}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Предыдущий ход"
      >
        ◀
      </button>
      <button
        style={S.button}
        onClick={onNext}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Следующий ход"
      >
        ▶
      </button>
    </div>
  );
}
