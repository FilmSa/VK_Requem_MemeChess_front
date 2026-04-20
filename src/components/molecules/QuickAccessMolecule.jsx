import Divider from "../atoms/Divider.jsx";
import MediaPreviewCard from "./MediaPreviewCard.jsx";

export default function QuickAccessMolecule({
  title = "Эмодзи:",
  label = "Быстрый доступ:",
  items = [],
  onItemClick,
  disabled = false,
}) {
  return (
    <section
      className="px-[14px] pb-[16px] pt-[12px]"
      style={{
        background: "var(--main-menu-gradient-active)",
        borderBottom: "1px solid var(--main-menu-divider)",
      }}
    >
      <div
        className="text-[32px] font-medium leading-none text-white"
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {title}
      </div>

      <Divider className="mt-[16px]" />

      <div
        className="mt-[14px] text-[18px] font-medium leading-none text-white"
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {label}
      </div>

      <div className="mt-[14px] grid grid-cols-3 gap-[12px]">
        {items.map((item) => (
          <MediaPreviewCard
            key={item.id}
            title={item.title}
            imageSrc={item.imageSrc}
            videoSrc={item.videoSrc}
            cornerStyle="diagonal"
            disabled={disabled}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>
    </section>
  );
}
