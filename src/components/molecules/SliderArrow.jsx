import { withAssetBase } from "../../shared/lib/assets.js";

export default function SliderArrow({
  direction = "left",
  onClick,
  className = "",
  disabled = false,
}) {
  const isLeft = direction === "left";
  const iconSrc = withAssetBase(isLeft ? "/icons/left.svg" : "/icons/right.svg");
  const label = isLeft
    ? "\u041d\u0430\u0437\u0430\u0434"
    : "\u0412\u043f\u0435\u0440\u0435\u0434";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex w-[47px] shrink-0 items-center justify-center overflow-hidden border-0 px-0 py-[20px] outline-none transition-opacity ${className}`}
      style={{
        background: "var(--shop-arrow-bg)",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <img
        src={iconSrc}
        alt={label}
        className="h-[clamp(26px,3vw,42px)] w-[clamp(26px,3vw,42px)]"
      />
    </button>
  );
}
