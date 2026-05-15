import Button from "../../shared/ui/atoms/Button.jsx";

const OUTCOME_STYLES = {
  win: {
    accent: "var(--color-accent)",
    glow: "rgba(0, 234, 255, 0.22)",
    badge: "rgba(0, 234, 255, 0.14)",
  },
  loss: {
    accent: "#ff6b7a",
    glow: "rgba(255, 107, 122, 0.2)",
    badge: "rgba(255, 107, 122, 0.14)",
  },
  draw: {
    accent: "#f6b73c",
    glow: "rgba(246, 183, 60, 0.2)",
    badge: "rgba(246, 183, 60, 0.14)",
  },
};

function renderAvatar(profile, fallbackLabel) {
  const label = String(profile?.name || profile?.username || fallbackLabel || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-[18px] text-[18px] font-semibold"
      style={{
        background: "rgba(255, 255, 255, 0.08)",
        color: "var(--color-text)",
      }}
    >
      {label || "?"}
    </div>
  );
}

function PlayerSummary({ label, profile, emphasize = false }) {
  const playerName = String(profile?.name || profile?.username || label || "").trim();

  return (
    <div
      className="flex items-center gap-3 rounded-[20px] border px-4 py-3"
      style={{
        borderColor: emphasize ? "var(--color-accent)" : "var(--modal-chip-border)",
        background: emphasize ? "rgba(255, 255, 255, 0.06)" : "var(--modal-chip-bg)",
        padding: 8
      }}
    >
      <div className="min-w-0">
        <div
          className="text-[20px] uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </div>
        <div className="truncate text-[18px] font-semibold">{playerName || "Игрок"}</div>
      </div>
    </div>
  );
}

export default function GameResultModal({
  isOpen,
  outcome = "draw",
  title = "Партия завершена",
  subtitle = "",
  reasonLabel = "",
  score = "",
  currentPlayer = null,
  opponentPlayer = null,
  primaryActionLabel = "На главную",
  onPrimaryAction,
  secondaryActionLabel = "Посмотреть доску",
  onSecondaryAction,
}) {
  if (!isOpen) {
    return null;
  }

  const palette = OUTCOME_STYLES[outcome] || OUTCOME_STYLES.draw;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        pointerEvents: "none",
      }}
    >
      <div
        className="flex flex-col overflow-hidden rounded-[28px] border"
        style={{
          borderColor: "var(--modal-border)",
          background: `
            radial-gradient(circle at top, ${palette.glow} 0%, transparent 62%),
            var(--modal-surface)
          `,
          color: "var(--color-text)",
          boxShadow: "var(--modal-shadow)",
          pointerEvents: "auto",
          width: "min(100%, 640px)",
          maxHeight: "calc(100% - 40px)",
          overflowY: "auto",
          padding: 20,
          gap: 10,
        }}
      >
        <div className="px-6 py-5">
          <div
            className="inline-flex rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{
              color: palette.accent,
              background: palette.badge,
            }}
          >
            {title}
          </div>

          <div className="mt-5 text-[34px] font-semibold leading-none">{score || title}</div>
          {subtitle ? (
            <div
              className="mt-3 max-w-[520px] text-[18px] leading-7"
              style={{ color: "var(--color-text-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}

          {reasonLabel ? (
            <div
              className="mt-4 inline-flex rounded-[16px] text-[20px] font-medium"
            >
              {reasonLabel}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 px-6 pb-6 md:grid-cols-2">
          <PlayerSummary
            label="Вы"
            profile={currentPlayer}
            emphasize={outcome === "win"}
          />
          <PlayerSummary
            label="Соперник"
            profile={opponentPlayer}
            emphasize={outcome === "loss"}
          />
        </div>

        <div className="flex flex-wrap gap-3 px-6 pb-6">
          <Button variant="primary" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
          <Button variant="surface" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
