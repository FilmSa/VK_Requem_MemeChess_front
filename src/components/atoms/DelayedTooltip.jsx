import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../shared/hooks/useMediaQuery.js";

const OPEN_DELAY_MS = 500;
const TOOLTIP_OFFSET_PX = 14;
const VIEWPORT_GUTTER_PX = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function DelayedTooltip({
  content,
  children,
  className = "",
  style,
  disabled = false,
}) {
  const isMobile = useIsMobile();
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const openTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({
    top: -9999,
    left: -9999,
  });

  const clearOpenTimer = useCallback(() => {
    if (!openTimerRef.current) {
      return;
    }

    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const hideTooltip = useCallback(() => {
    clearOpenTimer();
    setIsOpen(false);
    longPressTriggeredRef.current = false;
  }, [clearOpenTimer]);

  const updatePosition = useCallback(() => {
    const anchorElement = anchorRef.current;
    const tooltipElement = tooltipRef.current;

    if (!anchorElement || !tooltipElement) {
      return;
    }

    const anchorRect = anchorElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    const left = clamp(
      centeredLeft,
      VIEWPORT_GUTTER_PX,
      window.innerWidth - tooltipRect.width - VIEWPORT_GUTTER_PX
    );

    let top = anchorRect.top - tooltipRect.height - TOOLTIP_OFFSET_PX;

    if (top < VIEWPORT_GUTTER_PX) {
      top = Math.min(
        window.innerHeight - tooltipRect.height - VIEWPORT_GUTTER_PX,
        anchorRect.bottom + TOOLTIP_OFFSET_PX
      );
    }

    setTooltipStyle({
      top,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleViewportChange = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || !isMobile) {
      return;
    }

    const handlePointerDown = (event) => {
      const anchorElement = anchorRef.current;

      if (anchorElement?.contains(event.target)) {
        suppressClickRef.current = true;
      }

      hideTooltip();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [hideTooltip, isMobile, isOpen]);

  useEffect(() => {
    return () => {
      clearOpenTimer();
    };
  }, [clearOpenTimer]);

  const scheduleOpen = useCallback(() => {
    if (disabled || !content) {
      return;
    }

    clearOpenTimer();
    openTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearOpenTimer, content, disabled]);

  const handleMouseEnter = () => {
    if (isMobile) {
      return;
    }

    scheduleOpen();
  };

  const handleMouseLeave = () => {
    if (isMobile) {
      return;
    }

    hideTooltip();
  };

  const handleTouchStart = () => {
    if (!isMobile || disabled || !content) {
      return;
    }

    clearOpenTimer();
    longPressTriggeredRef.current = false;
    openTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      suppressClickRef.current = true;
      setIsOpen(true);
    }, OPEN_DELAY_MS);
  };

  const handleTouchEnd = () => {
    if (!isMobile) {
      return;
    }

    clearOpenTimer();
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current && !longPressTriggeredRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
    longPressTriggeredRef.current = false;
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={className}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={handleClickCapture}
        onContextMenu={isMobile ? (event) => event.preventDefault() : undefined}
      >
        {children}
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tooltipRef}
              role="tooltip"
              style={{
                position: "fixed",
                top: tooltipStyle.top,
                left: tooltipStyle.left,
                zIndex: 2147483646,
                maxWidth: "min(320px, calc(100vw - 24px))",
                padding: isMobile ? "12px 14px" : "14px 16px",
                border: "1px solid var(--notification-border)",
                borderRadius: isMobile ? 16 : 18,
                background: "var(--notification-surface)",
                color: "var(--notification-text)",
                boxShadow: "var(--notification-shadow)",
                fontFamily: '"Unbounded", sans-serif',
                fontSize: isMobile ? 12 : 13,
                lineHeight: 1.5,
                letterSpacing: "0.01em",
                pointerEvents: "none",
                backdropFilter: "blur(12px)",
              }}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
