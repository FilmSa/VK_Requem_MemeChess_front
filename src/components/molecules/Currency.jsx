import Badge from "../atoms/Badge";
import Icon from "../atoms/Icon";
import Text from "../atoms/Text";

function resolveValueFontSize(value) {
  const text = String(value ?? "").trim();

  if (text.length >= 12) {
    return "11px";
  }

  if (text.length >= 9) {
    return "12px";
  }

  if (text.length >= 7) {
    return "13px";
  }

  return "14px";
}

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
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div className="flex min-w-0 items-center gap-[10px]">
        <Icon
          src={icon}
          alt=""
          className="h-[18px] w-[18px] shrink-0 object-contain"
        />
        {label ? (
          <Text
            className="truncate text-[12px] font-semibold uppercase tracking-[0.12em] leading-none"
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
          fontSize: resolveValueFontSize(value),
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
