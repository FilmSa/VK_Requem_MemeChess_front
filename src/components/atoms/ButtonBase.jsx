export default function ButtonBase({
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button type={type} className={className} {...props}>
      {children}
    </button>
  );
}
