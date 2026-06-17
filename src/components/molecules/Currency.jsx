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
  const hasLabel = Boolean(label);

  const compactContent = (
    <div className="flex min-w-0 items-center justify-center gap-[6px]">
      <Icon
        src={icon}
        alt=""
        className="h-[14px] w-[14px] shrink-0 object-contain"
      />
      <Text
        className="shrink-0 whitespace-nowrap text-center font-semibold leading-none"
        style={{
          fontFamily: '"Unbounded", sans-serif',
          color: textColor,
          fontSize: "12px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Text>
    </div>
  );

  const content = (
    <Badge
      className={`w-full min-w-0 overflow-hidden border px-[6px] py-[10px] ${className}`}
      style={{
        borderColor,
        background,
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: hasLabel ? "flex-start" : "center",
        gap: hasLabel ? "8px" : "0px",
      }}
    >
      {hasLabel ? (
        <>
          <div className="flex shrink-0 items-center gap-[4px]">
            <Icon
              src={icon}
              alt=""
              className="h-[14px] w-[14px] shrink-0 object-contain"
            />
            <Text
              className="block min-w-0 truncate text-[10px] font-semibold leading-none uppercase tracking-[0.12em]"
              style={{
                fontFamily: '"Unbounded", sans-serif',
                color: textColor,
                opacity: 0.82,
              }}
            >
              {label}
            </Text>
          </div>
          <Text
            className="block min-w-0 flex-1 truncate text-right font-semibold leading-none"
            style={{
              fontFamily: '"Unbounded", sans-serif',
              color: textColor,
              fontSize: "12px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </Text>
        </>
      ) : (
        compactContent
      )}
    </Badge>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={accessibleLabel}
        className="block w-full min-w-0 overflow-hidden border-none bg-transparent p-0 text-left transition duration-150 hover:-translate-y-[2px] hover:brightness-110 focus-visible:-translate-y-[2px]"
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
      className="block no-underline transition duration-150 hover:-translate-y-[2px] hover:brightness-110 focus-visible:-translate-y-[2px]"
    >
      {content}
    </a>
  );
}
