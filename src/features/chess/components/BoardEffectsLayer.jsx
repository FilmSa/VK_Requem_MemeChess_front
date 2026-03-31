const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function normalizeOrientation(boardOrientation) {
  if (boardOrientation === "b" || boardOrientation === "black") {
    return "black";
  }

  return "white";
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

function getAssetType(effect) {
  if (effect?.type) {
    return effect.type;
  }

  const asset = effect?.asset?.toLowerCase?.() || "";

  if (asset.endsWith(".mp4") || asset.endsWith(".webm") || asset.endsWith(".ogg")) {
    return "video";
  }

  return "image";
}

function renderEffectMedia(effect) {
  const assetType = getAssetType(effect);

  if (assetType === "video") {
    return (
      <video
        src={effect.asset}
        autoPlay
        muted
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
}) {
  if (!Array.isArray(activeEffects) || activeEffects.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {activeEffects.map((effect) => {
        const coords = squareToCoords(
          effect?.square,
          boardOrientation,
          boardWidth
        );

        if (!coords) return null;

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
              pointerEvents: "none",
            }}
          >
            {renderEffectMedia(effect)}
          </div>
        );
      })}
    </div>
  );
}