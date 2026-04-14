import Icon from "../atoms/Icon";

const S = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "#060c2e",
    border: "1px solid rgba(0,234,255,0.12)",
    borderRadius: 12,
    fontFamily: "'Unbounded', sans-serif",
  },

  label: {
    fontSize: 14,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(232,238,255,0.5)",
  },

  valueSection: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  amount: {
    fontSize: 16,
    fontWeight: 500,
    color: "#00eaff",
    fontFamily: "'JetBrains Mono', monospace",
  },

  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    opacity: 0.8,
  },
};

export default function DepositBannerMolecule({
  amount = 1000,
  iconKey = "cup",
  label = "Депозит",
}) {
  return (
    <div style={S.container}>
      <span style={S.label}>{label}</span>
      <div style={S.valueSection}>
        <span style={S.amount}>{amount}</span>
        <div style={S.iconWrapper}>
          <Icon iconKey={iconKey} width={18} height={18} />
        </div>
      </div>
    </div>
  );
}
