import GameHeaderMolecule from "../molecules/GameHeaderMolecule";
import DepositBannerMolecule from "../molecules/DepositBannerMolecule";
import QuickAccessMolecule from "../molecules/QuickAccessMolecule";
import MoveHistoryMolecule from "../molecules/MoveHistoryMolecule";
import MoveNavigationMolecule from "../molecules/MoveNavigationMolecule";
import GameActionsMolecule from "../molecules/GameActionsMolecule";
import { BOARD_SIZE } from "../../features/chess/lib/boardConfig.js";

const S = {
  panel: {
    width: 510,
    height: Math.floor(BOARD_SIZE),
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#060c2e",
    borderRadius: 16,
    border: "1px solid rgba(0,234,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
    overflow: "hidden",
    fontFamily: "'Unbounded', sans-serif",
    padding: "12px",
  },

  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 4,
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(0,234,255,0.2) transparent",
  },

  moveHistoryWrapper: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },

  footer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexShrink: 0,
  },
};

export default function GameSettingsPanel({
  history = [],
  deposit = 1000,
  style,
  onResign,
  onDraw,
  actionsDisabled = false,
}) {
  const handleItemClick = (item) => {
    console.log("Быстрое действие:", item);
  };

  const handlePreviousMove = () => {
    console.log("Переход к предыдущему ходу");
  };

  const handleNextMove = () => {
    console.log("Переход к следующему ходу");
  };

  return (
    <div style={{ ...S.panel, ...style }}>
      <div>
        <GameHeaderMolecule iconKey="game" title="Партия" />
      </div>

      <div>
        <DepositBannerMolecule amount={deposit} iconKey="cup" label="Депозит" />
      </div>

      <div>
        <QuickAccessMolecule onItemClick={handleItemClick} />
      </div>

      <div style={S.content}>
        <div style={S.moveHistoryWrapper}>
          <MoveHistoryMolecule history={history} />
        </div>

        <div style={S.footer}>
          <MoveNavigationMolecule
            onPrevious={handlePreviousMove}
            onNext={handleNextMove}
          />
          <GameActionsMolecule
            onResign={onResign}
            onDraw={onDraw}
            disabled={actionsDisabled}
          />
        </div>
      </div>
    </div>
  );
}
