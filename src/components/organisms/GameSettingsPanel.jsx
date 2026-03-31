import GameHeaderMolecule from "../molecules/GameHeaderMolecule";
import DepositBannerMolecule from "../molecules/DepositBannerMolecule";
import QuickAccessMolecule from "../molecules/QuickAccessMolecule";
import MoveHistoryMolecule from "../molecules/MoveHistoryMolecule";
import MoveNavigationMolecule from "../molecules/MoveNavigationMolecule";
import GameActionsMolecule from "../molecules/GameActionsMolecule";
import { useBoardScale } from "../../features/chess/hooks/useBoardScale.js";
import { BOARD_SIZE, DEFAULT_AVATAR } from "../../features/chess/lib/boardConfig.js";


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

export default function GameSettingsPanel({ history = [], deposit = 1000, style }) {
  const handleItemClick = (item) => {
    // Future: Send quick access action via WebSocket
    console.log("Quick access item clicked:", item);
  };

  const handlePreviousMove = () => {
    // Future: Navigate to previous move in history
    console.log("Previous move");
  };

  const handleNextMove = () => {
    // Future: Navigate to next move in history
    console.log("Next move");
  };

  return (
    <div style={{ ...S.panel, ...style }}>
      {/* Top section: Game Info */}
      <div>
        <GameHeaderMolecule iconKey="game" title="Партия" />
      </div>

      {/* Deposit banner with icon */}
      <div>
        <DepositBannerMolecule amount={deposit} iconKey="cup" label="Депозит" />
      </div>

      {/* Quick access items */}
      <div>
        <QuickAccessMolecule onItemClick={handleItemClick} />
      </div>

      {/* Scrollable content area: Move history + Navigation */}
      <div style={S.content}>
        <div style={S.moveHistoryWrapper}>
          <MoveHistoryMolecule history={history} />
        </div>

        <div style={S.footer}>
          <MoveNavigationMolecule 
            onPrevious={handlePreviousMove} 
            onNext={handleNextMove}
          />
          <GameActionsMolecule />
        </div>
      </div>
    </div>
  );
}