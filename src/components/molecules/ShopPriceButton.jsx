import { withAssetBase } from "../../shared/lib/assets.js";

function formatPrice(price) {
  if (!Number.isFinite(price)) {
    return "0";
  }

  return new Intl.NumberFormat("ru-RU").format(price);
}

export default function ShopPriceButton({
  price,
  label,
  onClick,
  disabled = false,
  compact = false,
  className = "",
}) {
  const content = (
    <>
      <img
        src={withAssetBase("/icons/crown.svg")}
        alt=""
        className={`${compact ? "h-[16px] w-[16px]" : "h-[22px] w-[22px]"} shrink-0 drop-shadow-[0_0_10px_rgba(255,220,130,0.5)]`}
      />
      <span className="truncate">{label || formatPrice(price)}</span>
    </>
  );

  const sharedProps = {
    className: `flex w-full items-center justify-center gap-[10px] overflow-hidden rounded-[16px] border font-bold leading-none transition ${compact ? "h-[34px] px-[12px] text-[16px]" : "h-[42px] px-[16px] text-[24px]"} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:-translate-y-[1px] hover:brightness-110"} ${className}`,
    style: {
      background:
        "linear-gradient(135deg, rgba(110, 55, 199, 0.98) 0%, rgba(69, 25, 145, 0.98) 52%, rgba(151, 71, 233, 0.98) 100%)",
      color: "#fdf7ff",
      borderColor: "rgba(245, 200, 255, 0.5)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 24px rgba(48, 17, 93, 0.35)",
    },
  };

  if (onClick || disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        {...sharedProps}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center gap-[10px] overflow-hidden rounded-[16px] border font-bold leading-none ${compact ? "h-[34px] px-[12px] text-[16px]" : "h-[42px] px-[16px] text-[24px]"} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(110, 55, 199, 0.98) 0%, rgba(69, 25, 145, 0.98) 52%, rgba(151, 71, 233, 0.98) 100%)",
        color: "#fdf7ff",
        borderColor: "rgba(245, 200, 255, 0.5)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 24px rgba(48, 17, 93, 0.35)",
      }}
    >
      {content}
    </div>
  );
}
