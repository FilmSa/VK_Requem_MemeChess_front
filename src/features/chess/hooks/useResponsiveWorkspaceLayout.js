import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BOARD_SIZE,
  BOTTOM_PLAYER_PANEL_GAP,
  TOP_PLAYER_PANEL_GAP,
} from "../lib/boardConfig.js";

const DEFAULT_PLAYER_PANEL_HEIGHT = 64;
const MIN_PANEL_WIDTH = 360;
const MIN_CONTENT_GAP = 24;
const MAX_CONTENT_GAP = 50;
const PANEL_TO_BOARD_WIDTH_RATIO = 625 / 750;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getFallbackViewportSize() {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
    };
  }

  return {
    width: Math.max(0, window.innerWidth - 247),
    height: window.innerHeight,
  };
}

export function useResponsiveWorkspaceLayout() {
  const resizeObserverRef = useRef(null);
  const [viewportNode, setViewportNode] = useState(null);
  const [viewportSize, setViewportSize] = useState(getFallbackViewportSize);
  const [playerPanelHeights, setPlayerPanelHeights] = useState({
    topPanelHeight: DEFAULT_PLAYER_PANEL_HEIGHT,
    bottomPanelHeight: DEFAULT_PLAYER_PANEL_HEIGHT,
  });

  const viewportRef = useCallback((node) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (!node) {
      setViewportSize(getFallbackViewportSize());
    }

    setViewportNode(node || null);
  }, []);

  useEffect(() => {
    if (!viewportNode) {
      return undefined;
    }

    function updateViewportSize() {
      setViewportSize({
        width: viewportNode.clientWidth,
        height: viewportNode.clientHeight,
      });
    }

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(viewportNode);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
      if (resizeObserverRef.current === resizeObserver) {
        resizeObserverRef.current = null;
      }
    };
  }, [viewportNode]);

  const handleBoardMetricsChange = useCallback((nextMetrics) => {
    setPlayerPanelHeights((currentMetrics) => {
      const normalizedMetrics = {
        topPanelHeight:
          nextMetrics?.topPanelHeight || DEFAULT_PLAYER_PANEL_HEIGHT,
        bottomPanelHeight:
          nextMetrics?.bottomPanelHeight || DEFAULT_PLAYER_PANEL_HEIGHT,
      };

      if (
        currentMetrics.topPanelHeight === normalizedMetrics.topPanelHeight &&
        currentMetrics.bottomPanelHeight === normalizedMetrics.bottomPanelHeight
      ) {
        return currentMetrics;
      }

      return normalizedMetrics;
    });
  }, []);

  const layout = useMemo(() => {
    const viewportWidth = viewportSize.width || 0;
    const viewportHeight = viewportSize.height || 0;
    const contentGap = viewportWidth
      ? clamp(Math.round(viewportWidth * 0.03), MIN_CONTENT_GAP, MAX_CONTENT_GAP)
      : MAX_CONTENT_GAP;
    const maxBoardByHeight = viewportHeight
      ? viewportHeight -
        playerPanelHeights.topPanelHeight -
        playerPanelHeights.bottomPanelHeight -
        TOP_PLAYER_PANEL_GAP -
        BOTTOM_PLAYER_PANEL_GAP
      : BOARD_SIZE;
    const maxBoardByWidth = viewportWidth
      ? (viewportWidth - contentGap) / (1 + PANEL_TO_BOARD_WIDTH_RATIO)
      : BOARD_SIZE;

    const resolvedBoardSize = Math.floor(
      Math.max(0, Math.min(maxBoardByHeight, maxBoardByWidth, BOARD_SIZE * 2))
    );
    const boardSize = resolvedBoardSize || BOARD_SIZE;
    const panelWidth = Math.max(
      MIN_PANEL_WIDTH,
      Math.floor(boardSize * PANEL_TO_BOARD_WIDTH_RATIO)
    );
    const panelHeight = Math.floor(
      Math.max(
        playerPanelHeights.topPanelHeight + TOP_PLAYER_PANEL_GAP + boardSize,
        420
      )
    );

    return {
      boardSize,
      panelWidth,
      panelHeight,
      contentGap,
    };
  }, [playerPanelHeights, viewportSize.height, viewportSize.width]);

  return {
    viewportRef,
    layout,
    handleBoardMetricsChange,
  };
}
