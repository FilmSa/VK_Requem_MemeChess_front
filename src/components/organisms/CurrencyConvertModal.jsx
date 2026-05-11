import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function normalizeAmount(value) {
  return String(value ?? "")
    .replace(/\D+/g, "")
    .replace(/^0+(?=\d)/, "");
}

export default function CurrencyConvertModal({
  isOpen,
  maxAmount = 0,
  isSubmitting = false,
  errorMessage = "",
  onClose,
  onSubmit,
}) {
  const [amount, setAmount] = useState("");
  const normalizedMaxAmount = Math.max(Number(maxAmount) || 0, 0);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const parsedAmount = Number.parseInt(amount || "0", 10) || 0;
  const isAmountTooHigh = parsedAmount > normalizedMaxAmount;
  const canSubmit = parsedAmount > 0 && !isSubmitting;
  const limitErrorMessage =
    isAmountTooHigh && normalizedMaxAmount >= 0
      ? `Недостаточно рейтинга. Доступно: ${new Intl.NumberFormat("ru-RU").format(normalizedMaxAmount)}.`
      : "";
  const displayedErrorMessage = errorMessage || limitErrorMessage;

  const quickAmounts = useMemo(() => {
    const values = [100, 250, 500, normalizedMaxAmount];
    return Array.from(new Set(values.filter((value) => value > 0))).slice(0, 4);
  }, [normalizedMaxAmount]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
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
        aria-label="Конвертация в короны"
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
          className="rounded-[12px] border text-[18px]"
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
          <div className="text-[30px] font-semibold">Конвертация в короны</div>
          <div
            className="mt-[10px] text-[16px] leading-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            Переводит рейтинг в короны 1:1. Доступно рейтинга:{" "}
            <span style={{ color: "var(--color-accent)" }}>
              {new Intl.NumberFormat("ru-RU").format(normalizedMaxAmount)}
            </span>
          </div>
        </div>

        <div
          className="mt-[16px] rounded-tl-[18px] rounded-br-[18px] border p-[16px]"
          style={{
            borderColor: "var(--modal-chip-border)",
            background: "var(--modal-chip-bg)",
          }}
        >
          <div
            className="text-[12px] uppercase tracking-[0.2em]"
            style={{ color: "var(--color-accent)" }}
          >
            Сумма
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(normalizeAmount(event.target.value))}
            placeholder="Введите сумму"
            className="mt-[12px] h-[54px] w-full rounded-[16px] border px-[16px] text-[18px] outline-none"
            style={{
              borderColor: "var(--modal-chip-border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--color-text)",
            }}
          />

          <div className="mt-[14px] flex flex-wrap gap-[10px]">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="rounded-tl-[14px] rounded-br-[14px] border px-[14px] py-[10px] text-[14px] font-medium transition hover:brightness-110"
                style={{
                  borderColor: "var(--modal-chip-border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--color-text)",
                }}
              >
                {new Intl.NumberFormat("ru-RU").format(value)}
              </button>
            ))}
          </div>
        </div>

        {displayedErrorMessage ? (
          <div className="mt-[14px] text-[14px]" style={{ color: "#ff8a8a" }}>
            {displayedErrorMessage}
          </div>
        ) : null}

        <div className="mt-[18px] flex flex-wrap gap-[12px]">
          <button
            type="button"
            onClick={() => onSubmit?.(parsedAmount)}
            disabled={!canSubmit}
            className="rounded-tl-[18px] rounded-br-[18px] border-none px-[18px] py-[12px] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--color-accent)" }}
          >
            {isSubmitting ? "Конвертируем..." : "Конвертировать"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-tl-[18px] rounded-br-[18px] border px-[18px] py-[12px] text-[15px] font-semibold transition"
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
