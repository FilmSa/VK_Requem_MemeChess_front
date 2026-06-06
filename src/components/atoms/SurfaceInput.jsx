import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const shapeClasses = {
  full: "rounded-[15px]",
  start: "rounded-bl-[15px] rounded-tl-[15px] rounded-tr-[15px]",
  end: "rounded-br-[15px] rounded-tl-[15px] rounded-tr-[15px]",
};

export default function SurfaceInput({
  shape = "full",
  className = "",
  ...props
}) {
  const isMobile = useIsMobile();

  const inputStyle = {
    color: "var(--main-menu-text)",
    fontSize: isMobile ? 16 : 20,
    fontWeight: 500,
    fontFamily: '"Unbounded", sans-serif',
  };

  const sizeClass = isMobile
    ? "h-[30px] w-[78px] px-[10px]"
    : "h-[36px] w-[98px] px-[14px]";

  return (
    <input
      className={`border-none outline-none placeholder:text-[var(--color-text-soft)] disabled:cursor-not-allowed disabled:opacity-70 ${sizeClass} ${
        shapeClasses[shape] || shapeClasses.full
      } ${className}`}
      style={{
        ...inputStyle,
        background: "var(--main-menu-control-bg)",
        boxShadow: "var(--main-menu-surface-shadow)",
      }}
      {...props}
    />
  );
}