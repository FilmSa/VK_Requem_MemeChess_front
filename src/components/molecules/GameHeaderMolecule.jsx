import Icon from "../atoms/Icon";

const S = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#060c2e",
    border: "1px solid rgba(0,234,255,0.12)",
    borderRadius: 16,
    fontFamily: "'Unbounded', sans-serif",
  },
  
  titleSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  
  title: {
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#e8eeff",
  },
  
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    opacity: 0.7,
  },
};

export default function GameHeaderMolecule({ iconKey = "game", title = "Партия" }) {
  return (
    <div style={S.container}>
      <div style={S.titleSection}>
        <span style={S.title}>{title}</span>
        <div style={S.iconWrapper}>
          <Icon iconKey={iconKey} width={20} height={20} />
        </div>
      </div>
    </div>
  );
}
