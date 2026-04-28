import GameHeaderMolecule from "../../../components/molecules/GameHeaderMolecule.jsx";
import QuickAccessMolecule from "../../../components/molecules/QuickAccessMolecule.jsx";
import MoveHistoryMolecule from "../../../components/molecules/MoveHistoryMolecule.jsx";
import MoveNavigationMolecule from "../../../components/molecules/MoveNavigationMolecule.jsx";
import GameActionsMolecule from "../../../components/molecules/GameActionsMolecule.jsx";

const panelStyle = {
  width: "100%",
  maxWidth: "100%",
  height: "100%",
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

function formatStakeValue(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Дипозит: 0";
  }

  return `Дипозит: ${new Intl.NumberFormat("ru-RU").format(value)}`;
}

export default function GameSettingsPanel({
  style,
  emojiQuickAccessItems = [],
  onEmojiSelect,
  emojiCooldownActive = false,
  history = [],
  activeHistoryPly = history.length,
  canViewPrevious = false,
  canViewNext = false,
  onPreviousMove,
  onNextMove,
  onResign,
  onDraw,
  onDrawAccept,
  onDrawDecline,
  drawOfferState = null,
  actionsDisabled = false,
  resignDisabled = false,
  drawDisabled = false,
  stakeAmount = 0,
}) {
  return (
    <section style={{ ...panelStyle, ...style }}>
      <GameHeaderMolecule
        iconKey="game"
        title="Партия"
        meta={formatStakeValue(stakeAmount)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuickAccessMolecule
          items={emojiQuickAccessItems}
          onItemClick={onEmojiSelect}
          disabled={emojiCooldownActive}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[12px] pb-[12px] pt-[14px]">
          <div className="flex-shrink-0 overflow-hidden">
            <MoveHistoryMolecule history={history} activePly={activeHistoryPly} />
          </div>

          <div className="mt-[16px]">
            <MoveNavigationMolecule
              onPrevious={onPreviousMove}
              onNext={onNextMove}
              previousDisabled={!canViewPrevious}
              nextDisabled={!canViewNext}
            />
          </div>

          <div
            className="mt-[18px] h-px w-full flex-shrink-0"
            style={{ background: "var(--main-menu-divider)" }}
          />

          <div className="pt-[18px] flex-shrink-0">
            <GameActionsMolecule
              onResign={onResign}
              onDraw={onDraw}
              onDrawAccept={onDrawAccept}
              onDrawDecline={onDrawDecline}
              drawOfferState={drawOfferState}
              disabled={actionsDisabled}
              resignDisabled={resignDisabled}
              drawDisabled={drawDisabled}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
