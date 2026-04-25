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

export default function GameActionsMolecule({
  onResign = async () => {},
  onDraw = async () => {},
  disabled = false,
  resignDisabled = false,
  drawDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isResignDisabled = disabled || isLoading || resignDisabled;
  const isDrawDisabled = disabled || isLoading || drawDisabled;

  async function handleAction(action) {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
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
