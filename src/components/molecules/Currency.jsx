import Badge from "../atoms/Badge";
import Icon from "../atoms/Icon";
import Text from "../atoms/Text";

export default function CurrencyBadge({
  icon,
  value,
  href,
  onClick,
  label,
  background,
  borderColor,
  textColor,
  className = "",
}) {
  const accessibleLabel = label ? `${label}: ${value}` : String(value);

  const content = (
    <Badge
      className={`w-full border px-[12px] py-[10px] ${className}`}
      style={{
        borderColor,
        background,
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "4px",
      }}
    >
      <div className="flex min-w-0 items-center gap-[4px]">
        <Icon
          src={icon}
          alt=""
          className="h-[18px] w-[18px] shrink-0 object-contain"
        />
        {label ? (
          <Text
            className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] leading-none"
            style={{
              fontFamily: '"Unbounded", sans-serif',
              color: textColor,
              opacity: 0.82,
            }}
          >
            {label}
          </Text>
        ) : null}
      </div>
      <Text
        className="min-w-0 shrink whitespace-nowrap text-right font-semibold leading-none"
        style={{
          fontFamily: '"Unbounded", sans-serif',
          color: textColor,
          fontSize: "12px",
        }}
      >
        {value}
      </Text>
    </Badge>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={accessibleLabel}
        className="block w-full border-none bg-transparent p-0 text-left transition hover:brightness-110"
      >
        {content}
      </button>
    );
  }

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      title={label}
      aria-label={accessibleLabel}
      className="block no-underline transition hover:brightness-110"
    >
      {content}
    </a>
  );
}
