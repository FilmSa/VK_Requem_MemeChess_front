import { useState } from "react";
import Icon from "../atoms/Icon.jsx";

function ActionButton({
  label,
  iconKey,
  title,
  background,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-[46px] flex-1 items-center justify-between rounded-tl-[20px] rounded-br-[20px] border-none px-[16px] py-[8px] text-white shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background,
        fontFamily: '"Unbounded", sans-serif',
      }}
    >
      <span className="text-[16px] font-medium leading-none">{label}</span>
      <Icon iconKey={iconKey} width={20} height={20} />
    </button>
  );
}

function SecondaryButton({ label, onClick, disabled, tone = "neutral" }) {
  const styleByTone = {
    neutral: {
      background: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    success: {
      background: "rgba(40, 167, 69, 0.18)",
      borderColor: "rgba(78, 214, 109, 0.32)",
    },
    danger: {
      background: "rgba(243, 56, 86, 0.18)",
      borderColor: "rgba(243, 56, 86, 0.3)",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-[14px] border px-[12px] py-[10px] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        ...styleByTone[tone],
        fontFamily: '"Unbounded", sans-serif',
      }}
    >
      {label}
    </button>
  );
}

export default function GameActionsMolecule({
  onResign = async () => {},
  onDraw = async () => {},
  onDrawAccept = async () => {},
  onDrawDecline = async () => {},
  drawOfferState = null,
  disabled = false,
  resignDisabled = false,
  drawDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isResignDisabled = disabled || isLoading || resignDisabled;
  const isDrawDisabled = disabled || isLoading || drawDisabled;
  const showIncomingDrawOffer = drawOfferState?.mode === "incoming";
  const drawStatusText = drawOfferState?.message || "";

  async function handleAction(action) {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-[12px]">
      {drawStatusText ? (
        <div
          className="rounded-[16px] px-[14px] py-[12px] text-[13px] leading-6"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            color: "var(--main-menu-text)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          {drawStatusText}
        </div>
      ) : null}

      {showIncomingDrawOffer ? (
        <div className="flex items-center gap-[12px]">
          <SecondaryButton
            label="Принять"
            onClick={() => handleAction(onDrawAccept)}
            disabled={disabled || isLoading}
            tone="success"
          />
          <SecondaryButton
            label="Отклонить"
            onClick={() => handleAction(onDrawDecline)}
            disabled={disabled || isLoading}
            tone="danger"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-[16px]">
        <ActionButton
          label="Сдаться"
          iconKey="surrender"
          title="Сдаться"
          background="linear-gradient(180deg, #F33856 0%, #99152F 100%)"
          onClick={() => handleAction(onResign)}
          disabled={isResignDisabled}
        />
        <ActionButton
          label={showIncomingDrawOffer ? "Ничья ждёт" : "Ничья"}
          iconKey="draw"
          title="Предложить ничью"
          background="var(--main-menu-gradient-pink)"
          onClick={() => handleAction(onDraw)}
          disabled={isDrawDisabled}
        />
      </div>
    </div>
  );
}
