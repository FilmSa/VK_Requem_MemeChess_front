import { useEffect, useRef } from "react";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function clampVolume(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function normalizeOrientation(boardOrientation) {
  return boardOrientation === "b" || boardOrientation === "black"
    ? "black"
    : "white";
}

function squareToCoords(square, boardOrientation, boardWidth) {
  if (!square || typeof square !== "string" || square.length < 2) {
    return null;
  }

  const orientation = normalizeOrientation(boardOrientation);
  const cellSize = boardWidth / 8;
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;

  if (file < 0 || Number.isNaN(rank) || rank < 0 || rank > 7) {
    return null;
  }

  if (orientation === "white") {
    return {
      left: file * cellSize,
      top: (7 - rank) * cellSize,
      size: cellSize,
    };
  }

  return {
    left: (7 - file) * cellSize,
    top: rank * cellSize,
    size: cellSize,
  };
}

function EffectVideo({ effect, layerVolume }) {
  const videoRef = useRef(null);
  const useInlineMediaAudio = Boolean(effect?.useInlineMediaAudio);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    videoElement.muted = !useInlineMediaAudio;
    if (useInlineMediaAudio) {
      videoElement.volume = clampVolume((effect?.baseVolume ?? 1) * layerVolume);
    }
  }, [effect?.baseVolume, layerVolume, useInlineMediaAudio]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    videoElement.currentTime = 0;
    videoElement.play().catch(() => {});
  }, [effect?.instanceId]);

  return (
    <video
      ref={videoRef}
      src={effect.asset}
      autoPlay
      muted={!useInlineMediaAudio}
      playsInline
      preload="auto"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

function renderEffectMedia(effect, layerVolume) {
  if (effect.mediaType === "video") {
    return <EffectVideo effect={effect} layerVolume={layerVolume} />;
  }

  return (
    <img
      src={effect.asset}
      alt={effect.name || "effect"}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

export default function BoardEffectsLayer({
  activeEffects = [],
  boardWidth,
  boardOrientation,
  layerVolume = 1,
}) {
  if (!Array.isArray(activeEffects) || activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="board-effects-layer">
      {activeEffects.map((effect) => {
        const coords = squareToCoords(
          effect?.square,
          boardOrientation,
          boardWidth
        );

        if (!coords) {
          return null;
        }

        return (
          <div
            key={effect.instanceId}
            style={{
              position: "absolute",
              left: coords.left,
              top: coords.top,
              width: coords.size,
              height: coords.size,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {renderEffectMedia(effect, layerVolume)}
          </div>
        );
      })}
    </div>
  );
}
