import { useState } from "react";
import Icon from "../atoms/Icon";

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 0",
  },

  label: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(232,238,255,0.6)",
    fontFamily: "'Unbounded', sans-serif",
    paddingLeft: 4,
  },

  tilesRow: {
    display: "flex",
    gap: 8,
    justifyContent: "space-between",
  },

  tile: (isActive) => ({
    flex: 1,
    aspectRatio: "1/1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: isActive ? "rgba(0,234,255,0.15)" : "rgba(0,234,255,0.08)",
    border: isActive
      ? "2px solid rgba(0,234,255,0.4)"
      : "1px solid rgba(0,234,255,0.12)",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: isActive ? "0 0 12px rgba(0,234,255,0.3)" : "none",
    padding: 8,
  }),

  tileIcon: {
    width: 28,
    height: 28,
  },
};

const QUICK_ACCESS_ITEMS = [
  {
    id: 1,
    iconKey: "sword",
    name: "Атака",
    description: "Быстрое действие: атака",
  },
  {
    id: 2,
    iconKey: "rock",
    name: "Скелет",
    description: "Быстрое действие: скелет",
  },
  {
    id: 3,
    iconKey: "cup",
    name: "Кубок",
    description: "Быстрое действие: кубок",
  },
];

export default function QuickAccessMolecule({
  items = QUICK_ACCESS_ITEMS,
  onItemClick,
}) {
  const [activeId, setActiveId] = useState(null);

  const handleClick = (item) => {
    setActiveId(item.id);
    onItemClick?.(item);
    setTimeout(() => setActiveId(null), 200);
  };

  return (
    <div style={S.container}>
      <label style={S.label}>Быстрый доступ:</label>
      <div style={S.tilesRow}>
        {items.map((item) => (
          <button
            key={item.id}
            style={S.tile(activeId === item.id)}
            onClick={() => handleClick(item)}
            title={item.description}
          >
            <Icon
              iconKey={item.iconKey}
              style={S.tileIcon}
              width="100%"
              height="100%"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export { QUICK_ACCESS_ITEMS };
