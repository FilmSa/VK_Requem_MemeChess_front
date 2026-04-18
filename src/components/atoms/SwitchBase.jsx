export default function SwitchBase({
  checked,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`relative h-[36px] w-[72px] overflow-hidden rounded-[15px] border-none ${className}`}
      style={{
        background: "var(--main-menu-control-bg)",
        boxShadow: "var(--main-menu-surface-shadow)",
      }}
      {...props}
    >
      <span
        className="absolute top-[1px] h-[34px] w-[34px] rounded-[15px] transition-all duration-200"
        style={{
          left: checked ? 37 : 1,
          background: checked ? "var(--color-success)" : "var(--color-text-soft)",
        }}
      />
    </button>
  );
}
