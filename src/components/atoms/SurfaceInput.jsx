const shapeClasses = {
  full: "rounded-[15px]",
  start: "rounded-bl-[15px] rounded-tl-[15px] rounded-tr-[15px]",
  end: "rounded-br-[15px] rounded-tl-[15px] rounded-tr-[15px]",
};

const inputStyle = {
  color: "var(--main-menu-text)",
  fontSize: 20,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

export default function SurfaceInput({
  shape = "full",
  className = "",
  ...props
}) {
  return (
    <input
      className={`h-[36px] w-[98px] border-none px-[14px] outline-none placeholder:text-[var(--color-text-soft)] disabled:cursor-not-allowed disabled:opacity-70 ${
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
