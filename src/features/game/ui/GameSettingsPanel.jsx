import ResponsivePanelFrame from "../../../components/atoms/ResponsivePanelFrame.jsx";
import GameActionsMolecule from "../../../components/molecules/GameActionsMolecule.jsx";
import GameHeaderMolecule from "../../../components/molecules/GameHeaderMolecule.jsx";
import MoveHistoryMolecule from "../../../components/molecules/MoveHistoryMolecule.jsx";
import MoveNavigationMolecule from "../../../components/molecules/MoveNavigationMolecule.jsx";
import QuickAccessMolecule from "../../../components/molecules/QuickAccessMolecule.jsx";

const GAME_SETTINGS_BASE_WIDTH = 625;
const GAME_SETTINGS_BASE_HEIGHT = 840;

const panelStyle = {
  width: GAME_SETTINGS_BASE_WIDTH,
  height: GAME_SETTINGS_BASE_HEIGHT,
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
    return "Депозит: 0";
  }

  return `Депозит: ${new Intl.NumberFormat("ru-RU").format(value)}`;
}

export default function GameSettingsPanel({
  style,
  emojiQuickAccessItems = [],
  onEmojiSelect,
  emojiCooldownActive = false,
  history = [],
  historyEntries = [],
  activeHistoryPly = history.length,
  canViewPrevious = false,
  canViewNext = false,
  onPreviousMove,
  onNextMove,
  memeEffectsVolume = 0.5,
  onMemeEffectsVolumeChange,
  onResign,
  onResignConfirm,
  onResignCancel,
  onDraw,
  onDrawAccept,
  onDrawDecline,
  drawOfferState = null,
  isResignConfirmMode = false,
  actionsDisabled = false,
  resignDisabled = false,
  drawDisabled = false,
  stakeAmount = 0,
}) {
  return (
    <ResponsivePanelFrame
      baseWidth={GAME_SETTINGS_BASE_WIDTH}
      baseHeight={GAME_SETTINGS_BASE_HEIGHT}
      style={style}
    >
      <section style={panelStyle}>
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[12px] pb-[12px] pt-[10px]">
            <div className="flex-shrink-0 overflow-hidden">
              <MoveHistoryMolecule
                history={history}
                historyEntries={historyEntries}
                activePly={activeHistoryPly}
              />
            </div>

            <div className="mt-[16px]">
              <MoveNavigationMolecule
                onPrevious={onPreviousMove}
                onNext={onNextMove}
                previousDisabled={!canViewPrevious}
                nextDisabled={!canViewNext}
                memeEffectsVolume={memeEffectsVolume}
                onMemeEffectsVolumeChange={onMemeEffectsVolumeChange}
              />
            </div>

            <div
              className="mt-[18px] h-px w-full flex-shrink-0"
              style={{ background: "var(--main-menu-divider)" }}
            />

            <div className="pt-[18px] flex-shrink-0">
              <GameActionsMolecule
                onResign={onResign}
                onResignConfirm={onResignConfirm}
                onResignCancel={onResignCancel}
                onDraw={onDraw}
                onDrawAccept={onDrawAccept}
                onDrawDecline={onDrawDecline}
                drawOfferState={drawOfferState}
                isResignConfirmMode={isResignConfirmMode}
                disabled={actionsDisabled}
                resignDisabled={resignDisabled}
                drawDisabled={drawDisabled}
              />
            </div>
          </div>
        </div>
      </section>
    </ResponsivePanelFrame>
  );
}
