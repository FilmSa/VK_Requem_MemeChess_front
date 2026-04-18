import GameHeaderMolecule from "../../../components/molecules/GameHeaderMolecule.jsx";
import QuickAccessMolecule from "../../../components/molecules/QuickAccessMolecule.jsx";
import MoveHistoryMolecule from "../../../components/molecules/MoveHistoryMolecule.jsx";
import MoveNavigationMolecule from "../../../components/molecules/MoveNavigationMolecule.jsx";
import GameActionsMolecule from "../../../components/molecules/GameActionsMolecule.jsx";

const panelStyle = {
  width: 500,
  maxWidth: "100%",
  height: 830,
  maxHeight: "100%",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderTopLeftRadius: 40,
  borderBottomRightRadius: 40,
  background: "var(--main-menu-panel-bg)",
  boxShadow: "var(--main-menu-panel-shadow)",
  fontFamily: '"Unbounded", sans-serif',
};

export default function GameSettingsPanel({
  history = [],
  activeHistoryPly = history.length,
  canViewPrevious = false,
  canViewNext = false,
  onPreviousMove,
  onNextMove,
  onResign,
  onDraw,
  actionsDisabled = false,
}) {
  const handleItemClick = (item) => {
    console.log("Быстрое действие:", item);
  };

  return (
    <section style={panelStyle}>
      <GameHeaderMolecule iconKey="game" title="Партия" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuickAccessMolecule onItemClick={handleItemClick} />

        <div className="flex min-h-0 flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
          <MoveHistoryMolecule history={history} activePly={activeHistoryPly} />

          <div className="mt-[16px]">
            <MoveNavigationMolecule
              onPrevious={onPreviousMove}
              onNext={onNextMove}
              previousDisabled={!canViewPrevious}
              nextDisabled={!canViewNext}
            />
          </div>

          <div
            className="mt-[18px] h-px w-full"
            style={{ background: "var(--main-menu-divider)" }}
          />

          <div className="pt-[18px]">
            <GameActionsMolecule
              onResign={onResign}
              onDraw={onDraw}
              disabled={actionsDisabled}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
