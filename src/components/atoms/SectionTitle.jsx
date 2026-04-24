export default function SectionTitle({ children, className = "" }) {
  return (
    <div
      className={`text-[20px] font-medium leading-none ${className}`}
      style={{
        fontFamily: '"Unbounded", sans-serif',
        color: "var(--main-menu-text)",
      }}
    >
      {children}
    </div>
  );
}
