import SwitchBase from "../atoms/SwitchBase.jsx";

export default function AuthToggleField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className="flex items-center justify-between gap-[16px] rounded-[16px] border px-[14px] py-[12px]"
      style={{
        borderColor: "var(--auth-card-border)",
        background: "var(--auth-input-background)",
      }}
    >
      <span
        className={`text-[15px] font-medium leading-[1.3] ${disabled ? "opacity-60" : "cursor-pointer"}`}
        style={{ color: "var(--auth-title-color)" }}
        onClick={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
      >
        {label}
      </span>

      <SwitchBase
        id={id}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={disabled ? "opacity-60" : ""}
      />
    </div>
  );
}
