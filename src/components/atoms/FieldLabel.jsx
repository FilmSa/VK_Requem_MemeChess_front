const labelStyle = {
  color: "var(--main-menu-text)",
  fontSize: 31,
  fontWeight: 500,
  fontFamily: '"Unbounded", sans-serif',
};

export default function FieldLabel({ children, className = "", style = {} }) {
  return (
    <span className={className} style={{ ...labelStyle, ...style }}>
      {children}
    </span>
  );
}
