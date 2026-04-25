import FieldLabel from "../atoms/FieldLabel.jsx";
import SurfaceInput from "../atoms/SurfaceInput.jsx";

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
  return (
    <div className="flex h-[68px] items-center justify-between px-[10px] py-[8px]">
      <FieldLabel>{label}</FieldLabel>

      <div className="flex w-[210px] items-center justify-between py-[6px]">
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
