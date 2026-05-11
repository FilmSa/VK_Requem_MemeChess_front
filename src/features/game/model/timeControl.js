const TIME_CONTROL_UNLIMITED = "unlimited";

const TIME_CONTROL_PRESETS = {
  classic: {
    id: "classic",
    label: "30+9",
    baseMs: 30 * 60 * 1000,
    incrementMs: 9 * 1000,
  },
  rapid: {
    id: "rapid",
    label: "15+9",
    baseMs: 15 * 60 * 1000,
    incrementMs: 9 * 1000,
  },
  blitz: {
    id: "blitz",
    label: "3+2",
    baseMs: 3 * 60 * 1000,
    incrementMs: 2 * 1000,
  },
  bullet: {
    id: "bullet",
    label: "1+5",
    baseMs: 60 * 1000,
    incrementMs: 5 * 1000,
  },
};

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return NaN;
}

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeStartedAt(value) {
  const normalizedValue = readString(value);
  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.startsWith("0001-01-01T00:00:00")) {
    return "";
  }

  return normalizedValue;
}

function parseTimeControlLabel(label) {
  const normalizedLabel = normalizeLabel(label);
  const match = normalizedLabel.match(/^(\d+)\+(\d+)$/);

  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const incrementSeconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(incrementSeconds)) {
    return null;
  }

  const exactPreset = Object.values(TIME_CONTROL_PRESETS).find(
    (preset) => normalizeLabel(preset.label) === normalizedLabel
  );
  if (exactPreset) {
    return exactPreset;
  }

  return {
    id: "",
    label: `${minutes}+${incrementSeconds}`,
    baseMs: minutes * 60 * 1000,
    incrementMs: incrementSeconds * 1000,
  };
}

export function normalizeTimeControlId(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue === TIME_CONTROL_UNLIMITED) {
    return TIME_CONTROL_UNLIMITED;
  }

  return TIME_CONTROL_PRESETS[normalizedValue]?.id || normalizedValue;
}

function isCanonicalTimeControlId(value) {
  return value === TIME_CONTROL_UNLIMITED || Boolean(TIME_CONTROL_PRESETS[value]);
}

export function resolveTimeControlConfig(source, fallback = {}) {
  const sourceId = normalizeTimeControlId(
    source?.time_control_id ?? source?.timeControlId ?? source?.id
  );
  const fallbackId = normalizeTimeControlId(
    fallback?.time_control_id ?? fallback?.timeControlId ?? fallback?.id
  );
  const sourceLabel = readString(
    source?.time_control_label,
    source?.timeControlLabel,
    source?.label
  );
  const fallbackLabel = readString(
    fallback?.time_control_label,
    fallback?.timeControlLabel,
    fallback?.label
  );

  const sourcePreset =
    (sourceId && TIME_CONTROL_PRESETS[sourceId]) || parseTimeControlLabel(sourceLabel);
  const fallbackPreset =
    (fallbackId && TIME_CONTROL_PRESETS[fallbackId]) ||
    parseTimeControlLabel(fallbackLabel);
  const preset = sourcePreset || fallbackPreset || null;
  const canonicalSourceId = isCanonicalTimeControlId(sourceId) ? sourceId : "";
  const canonicalFallbackId = isCanonicalTimeControlId(fallbackId)
    ? fallbackId
    : "";

  const explicitBaseMs = readNumber(
    source?.time_control_base_ms,
    source?.timeControlBaseMs,
    source?.baseMs,
    fallback?.time_control_base_ms,
    fallback?.timeControlBaseMs,
    fallback?.baseMs
  );
  const explicitIncrementMs = readNumber(
    source?.time_control_increment_ms,
    source?.timeControlIncrementMs,
    source?.incrementMs,
    fallback?.time_control_increment_ms,
    fallback?.timeControlIncrementMs,
    fallback?.incrementMs
  );

  const baseMs = Number.isFinite(explicitBaseMs)
    ? Math.max(0, explicitBaseMs)
    : preset?.baseMs ?? 0;
  const incrementMs = Number.isFinite(explicitIncrementMs)
    ? Math.max(0, explicitIncrementMs)
    : preset?.incrementMs ?? 0;

  const canonicalId =
    canonicalSourceId ||
    sourcePreset?.id ||
    canonicalFallbackId ||
    fallbackPreset?.id ||
    sourceId ||
    fallbackId ||
    "";
  const label = sourceLabel || preset?.label || fallbackLabel || "";
  const timed =
    baseMs > 0 ||
    Boolean(
      canonicalId &&
        canonicalId !== TIME_CONTROL_UNLIMITED &&
        canonicalId !== "timed"
    ) ||
    Boolean(parseTimeControlLabel(label));

  if (!timed) {
    return {
      id: canonicalId || TIME_CONTROL_UNLIMITED,
      label: label && canonicalId !== TIME_CONTROL_UNLIMITED ? label : "",
      baseMs: 0,
      incrementMs: 0,
      timed: false,
    };
  }

  return {
    id: canonicalId || preset?.id || "timed",
    label,
    baseMs,
    incrementMs,
    timed: baseMs > 0,
  };
}

export function normalizeServerRoomState(roomState, fallbackTimeControl = {}) {
  if (!roomState || typeof roomState !== "object") {
    return roomState;
  }

  const resolvedTimeControl = resolveTimeControlConfig(roomState, fallbackTimeControl);

  return {
    ...roomState,
    time_control_id: resolvedTimeControl.id || TIME_CONTROL_UNLIMITED,
    time_control_label: resolvedTimeControl.label,
    time_control_base_ms: resolvedTimeControl.baseMs,
    time_control_increment_ms: resolvedTimeControl.incrementMs,
    current_turn_started_at: normalizeStartedAt(roomState.current_turn_started_at),
  };
}
