import { useEffect, useState } from "react";
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
      background: "rgba(40, 167, 69, 0.22)",
      borderColor: "rgba(78, 214, 109, 0.34)",
    },
    danger: {
      background: "rgba(243, 56, 86, 0.22)",
      borderColor: "rgba(243, 56, 86, 0.34)",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[46px] flex-1 items-center justify-center rounded-tl-[20px] rounded-br-[20px] border px-[14px] py-[10px] text-[14px] font-medium text-white shadow-[0_4px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
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
  onResignConfirm = async () => {},
  onResignCancel = () => {},
  drawOfferState = null,
  isResignConfirmMode = false,
  disabled = false,
  resignDisabled = false,
  drawDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isResignDisabled = disabled || isLoading || resignDisabled;
  const isDrawDisabled = disabled || isLoading || drawDisabled;
  const showIncomingDrawOffer = drawOfferState?.mode === "incoming";

  useEffect(() => {
    if (disabled || resignDisabled) {
      onResignCancel?.();
    }
  }, [disabled, onResignCancel, resignDisabled]);

  useEffect(() => {
    if (showIncomingDrawOffer && isResignConfirmMode) {
      onResignCancel?.();
    }
  }, [isResignConfirmMode, onResignCancel, showIncomingDrawOffer]);

  async function handleAction(action) {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  }

  if (isResignConfirmMode) {
    return (
      <div className="flex items-center gap-[12px]">
        <SecondaryButton
          label="Отмена"
          onClick={onResignCancel}
          disabled={disabled || isLoading}
          tone="neutral"
        />
        <SecondaryButton
          label="Подтвердить"
          onClick={() => handleAction(onResignConfirm)}
          disabled={disabled || isLoading}
          tone="danger"
        />
      </div>
    );
  }

  if (showIncomingDrawOffer) {
    return (
      <div className="flex items-center gap-[12px]">
        <SecondaryButton
          label="Принять ничью"
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
    );
  }

  return (
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
        label="Ничья"
        iconKey="draw"
        title="Предложить ничью"
        background="var(--main-menu-gradient-pink)"
        onClick={() => handleAction(onDraw)}
        disabled={isDrawDisabled}
      />
    </div>
  );
}
