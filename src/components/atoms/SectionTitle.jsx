import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function SectionTitle({ children, className = "" }) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`font-medium leading-none ${className}`}
      style={{
        fontFamily: '"Unbounded", sans-serif',
        color: "var(--main-menu-text)",
        fontSize: isMobile ? 16 : 20,
      }}
    >
      {children}
    </div>
  );
}