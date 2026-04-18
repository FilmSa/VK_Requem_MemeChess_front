export default function CustomScrollbarWrapper({
  children,
  className = "",
  style,
}) {
  return (
    <div
      className={`main-menu-custom-scroll ${className}`}
      style={{
        ...style,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}
