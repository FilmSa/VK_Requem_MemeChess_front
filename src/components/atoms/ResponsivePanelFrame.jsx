import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function resolveScale(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return value;
}

export default function ResponsivePanelFrame({
  baseWidth,
  baseHeight,
  style,
  className = "",
  children,
}) {
  const resizeObserverRef = useRef(null);
  const [containerNode, setContainerNode] = useState(null);
  const [containerSize, setContainerSize] = useState({
    width: baseWidth,
    height: baseHeight,
  });

  const containerRef = useCallback(
    (node) => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      setContainerNode(node || null);

      if (!node) {
        setContainerSize({
          width: baseWidth,
          height: baseHeight,
        });
      }
    },
    [baseHeight, baseWidth]
  );

  useEffect(() => {
    if (!containerNode) {
      return undefined;
    }

    function updateContainerSize() {
      setContainerSize({
        width: Math.max(containerNode.clientWidth, 1),
        height: Math.max(containerNode.clientHeight, 1),
      });
    }

    updateContainerSize();

    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerNode);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();

      if (resizeObserverRef.current === resizeObserver) {
        resizeObserverRef.current = null;
      }
    };
  }, [containerNode]);

  const frameMetrics = useMemo(() => {
    const widthScale = containerSize.width / baseWidth;
    const heightScale = containerSize.height / baseHeight;
    const scale = resolveScale(Math.min(widthScale, heightScale));
    const scaledWidth = baseWidth * scale;

    return {
      scale,
      left: Math.max((containerSize.width - scaledWidth) / 2, 0),
    };
  }, [baseHeight, baseWidth, containerSize.height, containerSize.width]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: baseWidth,
          height: baseHeight,
          transformOrigin: "top left",
          transform: `translate(${frameMetrics.left}px, 0px) scale(${frameMetrics.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
