import MediaPreviewCard from "./MediaPreviewCard.jsx";

export default function CustomizationItemCard({
  item,
  isSelected,
  onClick,
}) {
  if (item.videoSrc) {
    return (
      <MediaPreviewCard
        title={item.title}
        videoSrc={item.videoSrc}
        previewTime={item.previewTime}
        cornerStyle={item.cornerStyle}
        isSelected={isSelected}
        ariaPressed={isSelected}
        onClick={onClick}
      />
    );
  }

  if (item.imageSrc) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className="relative aspect-[150/92] w-full overflow-hidden rounded-[20px] border border-transparent bg-[#0B0F2B] p-0 transition-transform duration-200 hover:scale-[1.01]"
        style={{
          boxShadow: isSelected
            ? "0 0 0 2px #FFFFFF"
            : "0 4px 4px rgba(0, 0, 0, 0.25)",
        }}
      >
        <img
          src={item.imageSrc}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className="relative aspect-[150/92] w-full overflow-hidden rounded-[20px] border border-transparent bg-[#0B0F2B] transition-transform duration-200 hover:scale-[1.01]"
      style={{
        boxShadow: isSelected
          ? "0 0 0 2px #FFFFFF"
          : "0 4px 4px rgba(0, 0, 0, 0.25)",
      }}
    >
      {!item.imageSrc && item.icon ? (
        <div className="flex h-full w-full items-center justify-center bg-[#0B0F2B]">
          <img
            src={item.icon}
            alt={item.title}
            className="h-[52px] w-[40px] object-contain"
          />
        </div>
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          background: isSelected
            ? "linear-gradient(0deg, rgba(82,56,200,0.22) 0%, rgba(82,56,200,0.22) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 100%)",
        }}
      />
    </button>
  );
}
