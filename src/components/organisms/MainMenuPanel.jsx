import CustomScrollbarWrapper from "../atoms/CustomScrollbarWrapper.jsx";
import MainMenuActionButton from "../molecules/MainMenuActionButton.jsx";
import MainMenuCardButton from "../molecules/MainMenuCardButton.jsx";
import MainMenuDepositField from "../molecules/MainMenuDepositField.jsx";
import MainMenuSelectField from "../molecules/MainMenuSelectField.jsx";
import MainMenuTabButton from "../molecules/MainMenuTabButton.jsx";
import MainMenuToggleField from "../molecules/MainMenuToggleField.jsx";
import CustomizationSection from "./CustomizationSection.jsx";

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

export default function MainMenuPanel({
  style,
  tabs,
  activeTabId,
  onTabSelect,
  cards,
  activeCardId,
  onCardSelect,
  modeField,
  memeField,
  depositField,
  customizeSections,
  onToggleCustomizeSection,
  onToggleCustomizeExpanded,
  actions,
  inviteError,
}) {
  const isCustomizeTab = activeTabId === "customize";

  return (
    <section style={{ ...panelStyle, ...style }}>
      <div className="relative flex h-[80px] w-full items-start overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "var(--main-menu-divider)" }}
        />
        {tabs.map((tab, index) => (
          <MainMenuTabButton
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={tab.id === activeTabId}
            isRightTab={index === 1}
            onClick={() => onTabSelect(tab.id)}
          />
        ))}
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
          isCustomizeTab
            ? "justify-start px-[3px] pb-[10px] pt-[15px]"
            : "justify-between p-[10px] pt-[18px]"
        }`}
      >
        {isCustomizeTab ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <CustomScrollbarWrapper className="h-full min-h-0 pr-[8px]">
              <div className="flex min-h-full flex-col gap-[17px]">
                {customizeSections.map((section) => (
                  <CustomizationSection
                    key={section.id}
                    section={section}
                    activeItemId={activeCardId}
                    onSelect={onCardSelect}
                    onToggle={() => onToggleCustomizeSection(section.id)}
                    onToggleExpanded={() => onToggleCustomizeExpanded(section.id)}
                  />
                ))}
              </div>
            </CustomScrollbarWrapper>
          </div>
        ) : (
          <>
            <div
              className="grid h-[330px] grid-cols-2 gap-[10px] overflow-hidden rounded-br-[40px] rounded-tl-[40px] px-[10px] pb-[10px] pt-[10px]"
              style={{ boxShadow: "var(--main-menu-surface-shadow)" }}
            >
              {cards.map((card, index) => (
                <MainMenuCardButton
                  key={card.id}
                  title={card.title}
                  time={card.time}
                  icon={card.icon}
                  background={card.background}
                  isSelected={activeCardId === card.id}
                  index={index}
                  onClick={() => onCardSelect(card.id)}
                />
              ))}
            </div>

            <div
              className="mt-[10px] rounded-br-[40px] rounded-tl-[40px] px-[10px]"
              style={{
                background: "var(--main-menu-panel-bg)",
                boxShadow: "var(--main-menu-surface-shadow)",
              }}
            >
              <MainMenuSelectField {...modeField} />
              <MainMenuToggleField {...memeField} />
              <MainMenuDepositField {...depositField} />
            </div>
          </>
        )}

        {!isCustomizeTab ? (
          <div className="mt-[10px] flex flex-col gap-[10px]">
            <MainMenuActionButton
              label={actions.startLabel}
              icon={actions.startIcon}
              backgroundStyle={{ background: "var(--main-menu-gradient-blue)" }}
              onClick={actions.onStart}
              disabled={actions.startDisabled}
            />

            <MainMenuActionButton
              label={actions.friendLabel}
              icon={actions.friendIcon}
              backgroundStyle={{ background: "var(--main-menu-gradient-pink)" }}
              onClick={actions.onFriendPlay}
              disabled={actions.friendDisabled}
            />

            {inviteError ? (
              <div
                className="rounded-br-[0px] rounded-tl-[20px] p-[14px] text-[14px]"
                style={{
                  borderColor: "var(--main-menu-error-border)",
                  background: "var(--main-menu-error-bg)",
                  color: "var(--main-menu-error-text)",
                }}
              >
                {inviteError}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
