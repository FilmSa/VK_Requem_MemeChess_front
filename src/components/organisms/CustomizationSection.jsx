import Divider from "../atoms/Divider.jsx";
import CustomizationGrid from "../molecules/CustomizationGrid.jsx";
import CustomizationHeader from "../molecules/CustomizationHeader.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

function SecondaryLabel({ children, className = "" }) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`font-medium leading-none ${className}`}
      style={{
        fontFamily: '"Unbounded", sans-serif',
        color: "var(--main-menu-text)",
        fontSize: isMobile ? 16 : 18,
      }}
    >
      {children}
    </div>
  );
}

export default function CustomizationSection({
  section,
  activeItemId,
  onSelect,
  onToggle,
  onToggleExpanded,
}) {
  const visibleOwnedItems = section.isExpanded
    ? section.ownedItems
    : section.ownedItems.slice(0, section.collapsedCount);
  const canExpand = section.ownedItems.length > section.collapsedCount;

  return (
    <section
      className="overflow-hidden rounded-[20px] p-[10px]"
      style={{
        background: "var(--main-menu-gradient-active)",
        boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)",
      }}
    >
      <CustomizationHeader
        title={section.title}
        isOpen={section.isOpen}
        onToggle={onToggle}
      />

      <div
        className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{
          gridTemplateRows: section.isOpen ? "1fr" : "0fr",
          opacity: section.isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <Divider />

          {section.quickAccessItems.length ? (
            <>
              <SecondaryLabel className="mt-[14px]">
                {section.quickAccessTitle}
              </SecondaryLabel>
              <CustomizationGrid
                items={section.quickAccessItems}
                activeItemId={activeItemId}
                selectedItemIds={section.selectedItemIds}
                onSelect={onSelect}
                className="mt-[12px]"
              />
            </>
          ) : null}

          {section.quickAccessItems.length && section.ownedItems.length ? (
            <Divider className="mt-[16px]" />
          ) : null}

          {section.ownedItems.length ? (
            <>
              <SecondaryLabel className="mt-[14px]">
                {section.ownedTitle}
              </SecondaryLabel>
              <CustomizationGrid
                items={visibleOwnedItems}
                activeItemId={activeItemId}
                selectedItemIds={section.selectedItemIds}
                onSelect={onSelect}
                className="mt-[12px]"
              />
            </>
          ) : null}

          {canExpand ? (
            <button
              type="button"
              onClick={onToggleExpanded}
              className="mt-[14px] ml-auto block border-none bg-transparent p-0 text-right text-[14px] font-medium uppercase tracking-[0.02em]"
              style={{
                fontFamily: '"Unbounded", sans-serif',
                color: "var(--main-menu-text)",
              }}
            >
              {section.isExpanded
                ? "\u0441\u0432\u0435\u0440\u043d\u0443\u0442\u044c"
                : "\u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0435\u0449\u0435"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}