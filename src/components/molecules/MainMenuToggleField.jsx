import FieldLabel from "../atoms/FieldLabel.jsx";
import SwitchBase from "../atoms/SwitchBase.jsx";

export default function MainMenuToggleField({
  label,
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <div className="flex h-[68px] items-center justify-between px-[10px] py-[8px]">
      <FieldLabel>{label}</FieldLabel>
      <SwitchBase
        checked={checked}
        disabled={disabled}
        className={disabled ? "cursor-not-allowed opacity-70" : ""}
        onClick={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
      />
    </div>
  );
}
