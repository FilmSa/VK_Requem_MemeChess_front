function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5M18.7 5.3L16.8 7.2M7.2 16.8L5.3 18.7M18.7 18.7L16.8 16.8M7.2 7.2L5.3 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M15.7 18.4C10.9 18.4 7 14.5 7 9.7C7 8.1 7.5 6.5 8.3 5.2C5 6.4 2.6 9.5 2.6 13.1C2.6 17.8 6.4 21.6 11.1 21.6C14.7 21.6 17.8 19.2 19 15.9C17.8 17.4 16.1 18.4 15.7 18.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeSwitch({
  checked,
  onToggle,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={
        checked
          ? "Переключить на темную тему"
          : "Переключить на светлую тему"
      }
      title={checked ? "Светлая тема" : "Темная тема"}
      className={`relative flex h-[34px] w-[72px] items-center rounded-full border border-[var(--color-border)] bg-[var(--sidebar-toggle-track)] p-[3px] transition-colors ${className}`}
    >
      <span className="flex w-full items-center justify-between px-[6px] text-[var(--sidebar-toggle-icon)] opacity-80">
        <SunIcon />
        <MoonIcon />
      </span>
      <span
        className="absolute top-[3px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--sidebar-toggle-thumb)] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-all"
        style={{ left: checked ? 43 : 3 }}
      >
        {checked ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
