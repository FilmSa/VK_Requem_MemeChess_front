import { cn } from "../../lib/cn.js";

export default function Button({
  children,
  variant = "surface",
  size = "md",
  fullWidth = false,
  justify = "center",
  icon,
  iconAlt = "",
  iconPosition = "end",
  className,
  type = "button",
  ...props
}) {
  const iconNode = icon ? (
    <img src={icon} alt={iconAlt} className="ui-button__icon" />
  ) : null;

  return (
    <button
      type={type}
      className={cn(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && "ui-button--full",
        justify === "between" && "ui-button--between",
        className
      )}
      {...props}
    >
      {iconPosition === "start" ? iconNode : null}
      <span className="ui-button__label">{children}</span>
      {iconPosition === "end" ? iconNode : null}
    </button>
  );
}
