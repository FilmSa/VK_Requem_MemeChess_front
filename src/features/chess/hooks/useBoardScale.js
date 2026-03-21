import { useEffect, useState } from "react";

export function useBoardScale(boardSize) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const horizontalPadding = 80;
      const verticalPadding = 80;

      const designWidth = 834;
      const designHeight = 54 + 26 + 834 + 18 + 54;

      const availableWidth = window.innerWidth - horizontalPadding;
      const availableHeight = window.innerHeight - verticalPadding;

      const scaleX = availableWidth / designWidth;
      const scaleY = availableHeight / designHeight;

      setScale(Math.min(scaleX, scaleY, 1));
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [boardSize]);

  return {
    scale,
    boardWidth: Math.floor(boardSize * scale),
  };
}