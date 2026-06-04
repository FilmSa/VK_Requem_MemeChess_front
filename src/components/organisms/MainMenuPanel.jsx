import { useMemo } from "react";
import CustomScrollbarWrapper from "../atoms/CustomScrollbarWrapper.jsx";
import ResponsivePanelFrame from "../atoms/ResponsivePanelFrame.jsx";
import MainMenuActionButton from "../molecules/MainMenuActionButton.jsx";
import MainMenuCardButton from "../molecules/MainMenuCardButton.jsx";
import MainMenuDepositField from "../molecules/MainMenuDepositField.jsx";
import MainMenuSelectField from "../molecules/MainMenuSelectField.jsx";
import MainMenuTabButton from "../molecules/MainMenuTabButton.jsx";
import MainMenuToggleField from "../molecules/MainMenuToggleField.jsx";
import CustomizationSection from "./CustomizationSection.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const MAIN_MENU_BASE_WIDTH = 625;
const MAIN_MENU_BASE_HEIGHT = 840;

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
}) {
  const isMobile = useIsMobile();
  const isCustomizeTab = activeTabId === "customize";

  const panelStyle = useMemo(() => ({
    width: isMobile ? "100%" : MAIN_MENU_BASE_WIDTH,
    height: isMobile ? "100%" : MAIN_MENU_BASE_HEIGHT,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: isMobile ? 24 : 40,
    borderBottomRightRadius: isMobile ? 24 : 40,
    background: "var(--main-menu-panel-bg)",
    boxShadow: "var(--main-menu-panel-shadow)",
    fontFamily: '"Unbounded", sans-serif',
  }), [isMobile]);

  const inner = (
    <section style={isMobile ? { ...panelStyle, ...style } : panelStyle}>
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
            ? "justify-start px-[10px] pb-[10px] pt-[15px]"
            : "justify-start p-[10px] pt-[18px]"
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
          <div className="min-h-0 flex-1 overflow-hidden">
            <CustomScrollbarWrapper className="h-full min-h-0 pr-[6px]">
              <div className="flex min-h-full flex-col gap-[30px] pb-[2px]">
                <div
                  className="grid min-h-[300px] grid-cols-2 gap-[10px] overflow-hidden rounded-br-[40px] rounded-tl-[40px] px-[10px] pb-[10px] pt-[10px]"
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
                  className="rounded-br-[40px] rounded-tl-[40px] px-[10px]"
                  style={{
                    background: "var(--main-menu-panel-bg)",
                    boxShadow: "var(--main-menu-surface-shadow)",
                  }}
                >
                  <MainMenuSelectField {...modeField} />
                  <MainMenuToggleField {...memeField} />
                  <MainMenuDepositField {...depositField} />
                </div>
              </div>
            </CustomScrollbarWrapper>
          </div>
        )}

        {!isCustomizeTab ? (
          <div className="mt-[10px] shrink-0 flex flex-col gap-[10px]">
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
          </div>
        ) : null}
      </div>
    </section>
  );

  if (isMobile) {
    return inner;
  }

  return (
    <ResponsivePanelFrame
      baseWidth={MAIN_MENU_BASE_WIDTH}
      baseHeight={MAIN_MENU_BASE_HEIGHT}
      style={style}
    >
      {inner}
    </ResponsivePanelFrame>
  );
}