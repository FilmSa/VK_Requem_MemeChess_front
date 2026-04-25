import { API_BASE_URL } from "../../../shared/config/api.js";

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

function buildAnalyzerUrl(path) {
  const configuredBaseUrl = normalizeBaseUrl(
    import.meta.env.VITE_ANALYZER_API_BASE_URL
  );
  const baseUrl = configuredBaseUrl || API_BASE_URL;

  if (!baseUrl) {
    throw new Error("Analyzer API base URL is not configured.");
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function createTimedRequestSignal(externalSignal, timeoutMs) {
  if (!externalSignal && !(Number.isFinite(timeoutMs) && timeoutMs > 0)) {
    return {
      signal: undefined,
      cleanup() {},
    };
  }

  const controller = new AbortController();
  let timeoutId = null;

  const abortRequest = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  const handleExternalAbort = () => {
    abortRequest();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortRequest();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = window.setTimeout(() => {
      abortRequest();
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (externalSignal) {
        externalSignal.removeEventListener("abort", handleExternalAbort);
      }
    },
  };
}

export async function analyzeMove({
  moves,
  move,
  depth = 3,
  signal,
  timeoutMs = 1500,
} = {}) {
  const requestSignal = createTimedRequestSignal(signal, timeoutMs);
  const response = await fetch(buildAnalyzerUrl("/api/v1/analyze/move"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      moves: Array.isArray(moves) ? moves : [],
      move: move || {},
      depth,
    }),
    signal: requestSignal.signal,
  }).finally(() => {
    requestSignal.cleanup();
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || `Move analysis failed with status ${response.status}`
    );
  }

  return payload?.result || null;
}
