import FieldLabel from "../atoms/FieldLabel.jsx";
import SurfaceInput from "../atoms/SurfaceInput.jsx";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function MainMenuDepositField({
  label,
  fromValue,
  toValue,
  fromPlaceholder,
  toPlaceholder,
  disabled = false,
  onFromChange,
  onToChange,
}) {
  const isMobile = useIsMobile();

  const rowClass = isMobile
    ? "flex h-[58px] items-center justify-between px-[7px] py-[6px]"
    : "flex h-[68px] items-center justify-between px-[10px] py-[8px]";

  const inputWrap = isMobile
    ? "flex w-[168px] items-center justify-between py-[4px]"
    : "flex w-[210px] items-center justify-between py-[6px]";

  return (
    <div className={rowClass}>
      <FieldLabel>{label}</FieldLabel>

      <div className={inputWrap}>
        <SurfaceInput
          value={fromValue}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          disabled={disabled}
          onChange={(event) => onFromChange(event.target.value)}
          placeholder={fromPlaceholder}
          shape="start"
        />
        <SurfaceInput
          value={toValue}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          disabled={disabled}
          onChange={(event) => onToChange(event.target.value)}
          placeholder={toPlaceholder}
          shape="end"
        />
      </div>
    </div>
  );
}