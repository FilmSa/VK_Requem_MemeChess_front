import { useEffect, useRef } from "react";

const HISTORY_VISIBLE_ROWS = 6;
const HISTORY_ROW_HEIGHT = 34;
const HISTORY_SCROLL_AREA_HEIGHT = HISTORY_VISIBLE_ROWS * HISTORY_ROW_HEIGHT + 8;
const HISTORY_HEADER_HEIGHT = 50;
const HISTORY_COLUMNS_HEIGHT = 42;
const HISTORY_FOOTER_HEIGHT = 44;
const HISTORY_CARD_HEIGHT =
  HISTORY_HEADER_HEIGHT +
  HISTORY_COLUMNS_HEIGHT +
  HISTORY_SCROLL_AREA_HEIGHT +
  HISTORY_FOOTER_HEIGHT;

function groupMoves(history) {
  const pairs = [];

  for (let index = 0; index < history.length; index += 2) {
    pairs.push({
      num: Math.floor(index / 2) + 1,
      white: history[index] ?? null,
      black: history[index + 1] ?? null,
    });
  }

  return pairs;
}

function formatCount(count) {
  if (count === 0) return "партия не начата";
  const mod = count % 10;
  const mod100 = count % 100;

  if (mod === 1 && mod100 !== 11) {
    return `${count} ход`;
  }

  if (mod >= 2 && mod <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} хода`;
  }

  return `${count} ходов`;
}

export default function MoveHistoryMolecule({
  history = [],
  activePly = history.length,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  const pairs = groupMoves(history);
  const activePairIndex = activePly > 0 ? Math.ceil(activePly / 2) - 1 : -1;
  const activeMoveIsBlack = activePly % 2 === 0 && activePly > 0;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-tl-[20px] rounded-br-[20px]"
      style={{
        height: HISTORY_CARD_HEIGHT,
        background: "var(--main-menu-control-bg)",
        boxShadow: "var(--main-menu-surface-shadow)",
      }}
    >
      <div
        className="flex items-center justify-between px-[16px] py-[12px]"
        style={{ borderBottom: "1px solid var(--main-menu-divider)" }}
      >
        <span
          className="text-[16px] font-medium uppercase tracking-[0.18em]"
          style={{
            color: "var(--main-menu-text)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          Ходы партии
        </span>
      </div>

      <div
        className="flex items-center px-[14px] py-[8px]"
        style={{ borderBottom: "1px solid var(--main-menu-divider)" }}
      >
        <span className="w-[37px] flex-shrink-0" />
        <span
          className="flex-1 text-center text-[16px] tracking-[0.1em]"
          style={{
            color: "var(--color-text-muted)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          Белые
        </span>
        <span
          className="flex-1 text-center text-[16px] tracking-[0.1em]"
          style={{
            color: "var(--color-text-muted)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          Черные
        </span>
      </div>

      {pairs.length ? (
        <div
          ref={listRef}
          className="game-history-scroll overflow-y-auto px-[6px] py-[4px]"
          style={{ height: HISTORY_SCROLL_AREA_HEIGHT }}
        >
          {pairs.map((pair, index) => {
            const isActiveRow = index === activePairIndex;
            const whiteIsActive = isActiveRow && !activeMoveIsBlack;
            const blackIsActive = isActiveRow && activeMoveIsBlack;

            return (
              <div
                key={pair.num}
                className="flex h-[34px] items-center gap-[2px] rounded-[8px] px-[6px] py-[4px]"
                style={{
                  background: isActiveRow
                    ? "rgba(82, 56, 200, 0.18)"
                    : index % 2 !== 0
                      ? "rgba(255, 255, 255, 0.025)"
                      : "transparent",
                }}
              >
                <span
                  className="w-[32px] flex-shrink-0 text-[16px]"
                  style={{
                    color: "var(--color-text-muted)",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {pair.num}.
                </span>

                <span
                  className="flex-1 truncate rounded-[5px] px-[3px] py-[4px] text-center text-[16px] font-medium"
                  style={{
                    color: whiteIsActive
                      ? "var(--color-accent-strong)"
                      : "var(--main-menu-text)",
                    textShadow: whiteIsActive
                      ? "0 0 8px rgba(30, 224, 255, 0.45)"
                      : "none",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {pair.white}
                </span>

                <span
                  className="flex-1 truncate rounded-[5px] px-[3px] py-[4px] text-center text-[16px] font-medium"
                  style={{
                    color: blackIsActive
                      ? "var(--color-accent-strong)"
                      : "var(--main-menu-text)",
                    textShadow: blackIsActive
                      ? "0 0 8px rgba(30, 224, 255, 0.45)"
                      : "none",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {pair.black ?? ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="flex items-center justify-center px-[24px] text-center text-[16px]"
          style={{
            height: HISTORY_SCROLL_AREA_HEIGHT,
            color: "var(--color-text-muted)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          Ходы появятся здесь
        </div>
      )}

      <div
        className="flex items-center justify-center px-[12px] py-[9px] text-[16px]"
        style={{
          borderTop: "1px solid var(--main-menu-divider)",
          color: "var(--color-text-muted)",
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {formatCount(history.length)}
      </div>
    </div>
  );
}
