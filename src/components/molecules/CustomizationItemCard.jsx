import MediaPreviewCard from "./MediaPreviewCard.jsx";

function getCardShadow(isSelected) {
  return isSelected
    ? "0 0 0 2px #FFFFFF"
    : "0 4px 4px rgba(0, 0, 0, 0.25)";
}

function CardButton({ children, isSelected, onClick, previewShape = "wide" }) {
  const shapeClassName =
    previewShape === "square"
      ? "aspect-square rounded-none"
      : "aspect-[16/9] rounded-[20px]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`
        relative w-full overflow-hidden border border-transparent p-0
        transition-transform duration-200 hover:scale-[1.01]
        ${shapeClassName}
      `}
      style={{
        background: "var(--main-menu-preview-bg)",
        boxShadow: getCardShadow(isSelected),
      }}
    >
      {children}
    </button>
  );
}

function BoardPreview({ item }) {
  const lightSquare = item.lightSquare || "#F4F4F4";
  const darkSquare = item.darkSquare || "#1A1A1A";

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden">
      <div style={{ backgroundColor: lightSquare }} />
      <div style={{ backgroundColor: darkSquare }} />
      <div style={{ backgroundColor: darkSquare }} />
      <div style={{ backgroundColor: lightSquare }} />
    </div>
  );
}

function PiecePreview({ item }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "var(--main-menu-preview-bg)" }}
    >
      <img
        src={item.icon}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </div>
  );
}

function PieceSetPreview({ item }) {
  const previewPieces = Array.isArray(item.previewPieces)
    ? item.previewPieces.slice(0, 4)
    : [];

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden">
      {previewPieces.map((pieceSrc, index) => (
        <div
          key={`${pieceSrc}-${index}`}
          className="relative overflow-hidden"
          style={{ background: "var(--main-menu-preview-bg)" }}
        >
          <img
            src={pieceSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      ))}
    </div>
  );
}

function SelectedOverlay({ isSelected }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: isSelected
          ? "linear-gradient(0deg, rgba(82,56,200,0.22) 0%, rgba(82,56,200,0.22) 100%)"
          : "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 100%)",
      }}
    />
  );
}

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

  if (item.previewType === "board") {
    return (
      <CardButton
        isSelected={isSelected}
        onClick={onClick}
        previewShape={item.previewShape}
      >
        <BoardPreview item={item} />
        <SelectedOverlay isSelected={isSelected} />
      </CardButton>
    );
  }

  if (item.previewType === "piece" && item.icon) {
    return (
      <CardButton
        isSelected={isSelected}
        onClick={onClick}
        previewShape={item.previewShape}
      >
        <PiecePreview item={item} />
        <SelectedOverlay isSelected={isSelected} />
      </CardButton>
    );
  }

  if (item.imageSrc) {
    return (
      <CardButton
        isSelected={isSelected}
        onClick={onClick}
        previewShape={item.previewShape}
      >
        <img
          src={item.imageSrc}
          alt={item.title}
          className="absolute left-0 top-[-35%] h-[135%] w-full object-cover object-center"
        />
        <SelectedOverlay isSelected={isSelected} />
      </CardButton>
    );
  }

  return (
    <CardButton
      isSelected={isSelected}
      onClick={onClick}
      previewShape={item.previewShape}
    >
      {item.icon ? <PiecePreview item={item} /> : null}
      <SelectedOverlay isSelected={isSelected} />
    </CardButton>
  );
}
