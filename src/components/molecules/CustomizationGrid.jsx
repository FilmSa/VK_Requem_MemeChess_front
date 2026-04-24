import CustomizationItemCard from "./CustomizationItemCard.jsx";

export default function CustomizationGrid({
  items,
  activeItemId,
  selectedItemIds = [],
  onSelect,
  className = "",
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-3 gap-x-[12px] gap-y-[12px] ${className}`}
    >
      {items.map((item) => (
        <CustomizationItemCard
          key={item.id}
          item={item}
          isSelected={
            selectedItemIds.length > 0
              ? selectedItemIds.includes(item.id)
              : item.id === activeItemId
          }
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}
