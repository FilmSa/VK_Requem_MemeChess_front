import { useEffect, useRef } from "react";

const S = {
  panel: {
    width: 220,
    height: "100%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "#060c2e",
    borderRadius: 16,
    border: "1px solid rgba(0,234,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
    overflow: "hidden",
    fontFamily: "'Unbounded', sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(0,234,255,0.12)",
    background: "#07103a",
    flexShrink: 0,
  },

  title: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(232,238,255,0.35)",
  },

  cols: {
    display: "flex",
    alignItems: "center",
    padding: "6px 10px 6px 14px",
    borderBottom: "1px solid rgba(0,234,255,0.08)",
    flexShrink: 0,
  },

  colNum: {
    width: 28,
    flexShrink: 0,
  },

  colLabel: (isWhite) => ({
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    letterSpacing: "0.1em",
    color: isWhite ? "rgba(255,255,255,0.55)" : "rgba(150,160,200,0.5)",
  }),

  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 6px",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(0,234,255,0.2) transparent",
  },

  row: (isLast, isEven) => ({
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "4px 6px",
    borderRadius: 8,
    background: isLast
      ? "rgba(0,234,255,0.08)"
      : isEven
        ? "rgba(255,255,255,0.025)"
        : "transparent",
  }),

  rowNum: {
    width: 24,
    flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,238,255,0.35)",
  },

  cell: (isBlack, isActive) => ({
    flex: 1,
    textAlign: "center",
    padding: "3px 2px",
    borderRadius: 5,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    color: isActive ? "#00eaff" : isBlack ? "rgba(232,238,255,0.65)" : "#e8eeff",
    textShadow: isActive ? "0 0 8px rgba(0,234,255,0.6)" : "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },

  emptyIcon: {
    fontSize: 28,
    opacity: 0.2,
  },

  emptyText: {
    fontSize: 10,
    color: "rgba(232,238,255,0.35)",
    textAlign: "center",
    lineHeight: 1.6,
    letterSpacing: "0.05em",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderTop: "1px solid rgba(0,234,255,0.08)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,238,255,0.35)",
    flexShrink: 0,
  },
};


function groupMoves(history) {
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i] ?? null,
      black: history[i + 1] ?? null,
    });
  }
  return pairs;
}

function formatCount(n) {
  if (n === 0) return "партия не начата";
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return `${n} ход`;
  if (mod >= 2 && mod <= 4 && !(mod100 >= 12 && mod100 <= 14)) return `${n} хода`;
  return `${n} ходов`;
}


export default function MoveHistoryPanel({ history = [], height }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history]);

  const pairs = groupMoves(history);
  const lastIndex = pairs.length - 1;
  const lastMoveIsBlack = history.length % 2 === 0 && history.length > 0;

  return (
    <div style={{ ...S.panel, height }}>
      <div style={S.header}>
        <span style={S.title}>Ходы партии</span>
      </div>

      <div style={S.cols}>
        <span style={S.colNum} />
        <span style={S.colLabel(true)}>Белые</span>
        <span style={S.colLabel(false)}>Чёрные</span>
      </div>

      {pairs.length === 0 ? (
        <div style={S.empty}>
          <span style={S.emptyText}>Ходы появятся здесь</span>
        </div>
      ) : (
        <div style={S.list} ref={listRef}>
          {pairs.map((pair, index) => {
            const isLast = index === lastIndex;
            const whiteIsActive = isLast && !lastMoveIsBlack;
            const blackIsActive = isLast && lastMoveIsBlack;

            return (
              <div key={pair.num} style={S.row(isLast, index % 2 !== 0)}>
                <span style={S.rowNum}>{pair.num}.</span>
                <span style={S.cell(false, whiteIsActive)}>{pair.white}</span>
                <span style={S.cell(true, blackIsActive)}>{pair.black ?? ""}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={S.footer}>
        {formatCount(history.length)}
      </div>
    </div>
  );
}