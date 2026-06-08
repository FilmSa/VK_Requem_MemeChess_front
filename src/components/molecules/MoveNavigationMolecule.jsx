import Icon from "../atoms/Icon.jsx";
import { withAssetBase } from "../../shared/lib/assets.js";

function NavigationButton({ iconSrc, title, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-[48px] w-[52px] items-center justify-center border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon src={iconSrc} alt="" width={32} height={32} />
    </button>
  );
}

function VolumeIcon({ muted = false }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h4l5-4v12l-5-4H4z"
        fill={muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)"}
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="rgba(255,120,120,0.92)"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M16 9.2c1.2.8 1.9 1.95 1.9 2.8 0 .85-.7 2-1.9 2.8"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.9 6.8c2.1 1.6 3.1 3.37 3.1 5.2s-1 3.6-3.1 5.2"
            stroke="rgba(30,224,255,0.9)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

export default function MoveNavigationMolecule({
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  memeEffectsVolume = 0.5,
  onMemeEffectsVolumeChange,
}) {
  const clampedVolume = Math.min(1, Math.max(0, Number(memeEffectsVolume) || 0));
  const volumePercent = Math.round(clampedVolume * 100);
  const sliderFill = `${volumePercent}%`;

  return (
    <div
      className="flex w-full items-center gap-[10px] overflow-hidden rounded-tl-[16px] rounded-br-[16px] px-[10px]"
      style={{
        background: "var(--main-menu-control-bg)",
        boxShadow: "var(--main-menu-surface-shadow)",
      }}
    >
      <NavigationButton
        iconSrc={withAssetBase("/icons/left.svg")}
        title="Предыдущий ход"
        onClick={onPrevious}
        disabled={previousDisabled}
      />
      <NavigationButton
        iconSrc={withAssetBase("/icons/right.svg")}
        title="Следующий ход"
        onClick={onNext}
        disabled={nextDisabled}
      />
      <div
        className="flex min-w-0 flex-1 items-center gap-[10px] border-l pl-[12px]"
        style={{ borderColor: "var(--main-menu-divider)" }}
      >
        <div
          className="flex h-[34px] flex-shrink-0 items-center rounded-[10px] px-[10px]"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
          title="Громкость мем-эффектов"
        >
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: '"Unbounded", sans-serif',
            }}
          >
            Громкость мемов
          </span>
        </div>
        <span
          className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(255, 255, 255, 0.06)" }}
          title="Громкость мем-эффектов"
        >
          <VolumeIcon muted={clampedVolume <= 0.001} />
        </span>
<input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={clampedVolume}
            onChange={(event) =>
              onMemeEffectsVolumeChange?.(event.target.valueAsNumber)
            }
            aria-label="Громкость мем-эффектов"
            className="min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-transparent"
            style={{
              height: 4,
              padding: "12px 0",
              background: `linear-gradient(90deg, rgba(30,224,255,0.92) 0%, rgba(30,224,255,0.92) ${sliderFill}, rgba(255,255,255,0.14) ${sliderFill}, rgba(255,255,255,0.14) 100%)`,
              backgroundClip: "content-box",
            }}
          />
        <span
          className="w-[40px] flex-shrink-0 text-right text-[11px] tracking-[0.08em]"
          style={{
            color: "var(--color-text-muted)",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {volumePercent}%
        </span>
      </div>
    </div>
  );
}
