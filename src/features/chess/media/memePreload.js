import { ALL_MEME_ASSET_URLS, MEME_ASSET_VERSION } from "./memeConfig.js";

const MEME_PRELOAD_TIMEOUT_MS = 20_000;
const MEME_PRELOAD_CONCURRENCY = 4;

const readyAssetUrls = new Set();
let activePreloadVersion = "";
let activePreloadPromise = null;

async function isAssetAlreadyCached(assetUrl) {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }

  try {
    return Boolean(await window.caches.match(assetUrl));
  } catch {
    return false;
  }
}

async function preloadAsset(assetUrl) {
  if (!assetUrl || readyAssetUrls.has(assetUrl)) {
    return;
  }

  if (await isAssetAlreadyCached(assetUrl)) {
    readyAssetUrls.add(assetUrl);
    return;
  }

  const abortController =
    typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = abortController
    ? window.setTimeout(() => {
      abortController.abort();
    }, MEME_PRELOAD_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(assetUrl, {
      credentials: "same-origin",
      cache: "force-cache",
      signal: abortController?.signal,
    });
    if (!response.ok) {
      return;
    }

    await response.blob();
    readyAssetUrls.add(assetUrl);
  } catch {
    // Ignore preload failures and let the effect load on demand later.
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function runInParallel(items, worker, concurrency) {
  const queue = [...items];
  const workerCount = Math.max(1, Math.min(concurrency, queue.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const nextItem = queue.shift();
        if (!nextItem) {
          continue;
        }
        await worker(nextItem);
      }
    })
  );
}

export function preloadAllMemeAssets() {
  if (typeof window === "undefined" || ALL_MEME_ASSET_URLS.length === 0) {
    return Promise.resolve();
  }

  if (activePreloadVersion !== MEME_ASSET_VERSION) {
    activePreloadVersion = MEME_ASSET_VERSION;
    activePreloadPromise = null;
    readyAssetUrls.clear();
  }

  if (activePreloadPromise) {
    return activePreloadPromise;
  }

  activePreloadPromise = runInParallel(
    ALL_MEME_ASSET_URLS,
    preloadAsset,
    MEME_PRELOAD_CONCURRENCY
  )
    .catch(() => {})
    .then(() => undefined);

  return activePreloadPromise;
}
