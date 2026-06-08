import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

export default function FieldLabel({ children, className = "", style = {} }) {

  const isMobile = useIsMobile();

  const labelStyle = {
    color: "var(--main-menu-text)",
    fontSize: isMobile ? "16px" : "28px",
    fontWeight: 500,
    fontFamily: '"Unbounded", sans-serif',
  };

  return (
    <span className={className} style={{ ...labelStyle, ...style }}>
      {children}
    </span>
  );
}
