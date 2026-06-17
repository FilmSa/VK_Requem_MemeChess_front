import FieldLabel from "../atoms/FieldLabel.jsx";
import SwitchBase from "../atoms/SwitchBase.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function MainMenuToggleField({
  label,
  checked,
  disabled = false,
  onChange,
}) {
  const isMobile = useIsMobile();

  const rowClass = isMobile
    ? "flex h-[58px] items-center justify-between px-[7px] py-[6px]"
    : "flex h-[56px] items-center justify-between px-[10px] py-[6px]";

  return (
    <div className={rowClass}>
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
