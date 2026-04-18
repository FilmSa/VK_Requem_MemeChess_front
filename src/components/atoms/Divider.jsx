export default function Divider({ className = "" }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{ background: "var(--main-menu-customize-divider)" }}
    />
  );
}
