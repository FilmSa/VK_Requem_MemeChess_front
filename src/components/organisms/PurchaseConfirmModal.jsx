import { useEffect } from "react";
import { createPortal } from "react-dom";
import { withAssetBase } from "../../shared/lib/assets.js";

const crownIcon = withAssetBase("/icons/crown.svg");

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("ru-RU").format(value);
}

function resolveItemTypeLabel(type) {
  if (type === "piece_skin") {
    return "Скин";
  }

  if (type === "emote") {
    return "Эмоция";
  }

  return "Предмет";
}

export default function PurchaseConfirmModal({
  isOpen,
  item,
  isSubmitting = false,
  errorMessage = "",
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !item || typeof document === "undefined") {
    return null;
  }

  const itemTypeLabel = resolveItemTypeLabel(item.type);
  const itemTitle = item.title || "Предмет";
  const itemPrice = formatPrice(Number(item.price ?? 0));

  return createPortal(
    <div
      onClick={() => {
        if (!isSubmitting) {
          onClose?.();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "var(--modal-backdrop)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Подтверждение покупки"
        className="rounded-tl-[18px] rounded-br-[18px] border p-[22px]"
        style={{
          position: "relative",
          width: "min(100%, 560px)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          borderColor: "var(--modal-border)",
          background: "var(--modal-surface)",
          color: "var(--color-text)",
          boxShadow: "var(--modal-shadow)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-[12px] border text-[18px] disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderColor: "var(--modal-border)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--color-text)",
          }}
        >
          {"\u2715"}
        </button>

        <div style={{ paddingRight: "48px" }}>
          <div
            className="text-[12px] uppercase tracking-[0.2em]"
            style={{ color: "var(--color-accent)" }}
          >
            Подтверждение
          </div>
          <div className="mt-[10px] text-[30px] font-semibold">
            Купить предмет?
          </div>
          <div
            className="mt-[10px] text-[16px] leading-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            Вы точно хотите купить {itemTypeLabel.toLowerCase()}{" "}
            <span style={{ color: "var(--color-text)" }}>«{itemTitle}»</span> за{" "}
            <span
              className="inline-flex items-center gap-[8px]"
              style={{ color: "var(--color-accent)" }}
            >
              <img
                src={crownIcon}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
              {itemPrice}
            </span>
            
          </div>
        </div>

        <div className="mt-[16px] grid gap-[12px] sm:grid-cols-3">
          <div
            className="rounded-tl-[18px] rounded-br-[18px] border p-[14px]"
            style={{
              borderColor: "var(--modal-chip-border)",
              background: "var(--modal-chip-bg)",
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: "var(--color-accent)" }}
            >
              Тип
            </div>
            <div className="mt-[8px] text-[15px] font-medium">{itemTypeLabel}</div>
          </div>

          <div
            className="rounded-tl-[18px] rounded-br-[18px] border p-[14px]"
            style={{
              borderColor: "var(--modal-chip-border)",
              background: "var(--modal-chip-bg)",
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: "var(--color-accent)" }}
            >
              Предмет
            </div>
            <div className="mt-[8px] text-[15px] font-medium">{itemTitle}</div>
          </div>

          <div
            className="rounded-tl-[18px] rounded-br-[18px] border p-[14px]"
            style={{
              borderColor: "var(--modal-chip-border)",
              background: "var(--modal-chip-bg)",
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: "var(--color-accent)" }}
            >
              Цена
            </div>
            <div className="mt-[8px] flex items-center gap-[8px] text-[15px] font-medium">
              <img
                src={crownIcon}
                alt=""
                className="h-[16px] w-[16px] object-contain"
              />
              {itemPrice}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-[14px] text-[14px]" style={{ color: "#ff8a8a" }}>
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-[18px] flex flex-wrap gap-[12px]">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-tl-[18px] rounded-br-[18px] border-none px-[18px] py-[12px] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--color-accent)" }}
          >
            {isSubmitting ? "Покупаем..." : "Купить"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-tl-[18px] rounded-br-[18px] border px-[18px] py-[12px] text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--modal-chip-border)",
              background: "transparent",
              color: "var(--color-text)",
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
