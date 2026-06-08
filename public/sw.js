try {
  self.importScripts("./meme-precache.js");
} catch {
  self.__MEME_PRECACHE_VERSION = "v1";
  self.__MEME_PRECACHE_URLS = [];
}

const CACHE_VERSION = self.__MEME_PRECACHE_VERSION || "v1";
const CACHE_NAME = `memechess-shell-${CACHE_VERSION}`;
const OFFLINE_CACHE_NAME = `memechess-runtime-${CACHE_VERSION}`;
const MEME_CACHE_NAME = `memechess-memes-${CACHE_VERSION}`;
const MEME_PRECACHE_URLS = Array.isArray(self.__MEME_PRECACHE_URLS)
  ? self.__MEME_PRECACHE_URLS
  : [];

function normalizeBasePath(pathname) {
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalizedPath === "//" ? "/" : normalizedPath;
}

function withBasePath(assetPath, basePath) {
  if (!assetPath || typeof assetPath !== "string" || !assetPath.startsWith("/")) {
    return assetPath;
  }

  if (basePath === "/") {
    return assetPath;
  }

  return `${basePath.replace(/\/$/, "")}${assetPath}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const basePath = normalizeBasePath(self.location.pathname.replace(/sw\.js$/, ""));
      const shellCache = await caches.open(CACHE_NAME);
      await shellCache.addAll([basePath, `${basePath}index.html`]);

      if (MEME_PRECACHE_URLS.length === 0) {
        return;
      }

      const memeCache = await caches.open(MEME_CACHE_NAME);
      const precacheTargets = MEME_PRECACHE_URLS.map((assetPath) =>
        withBasePath(assetPath, basePath)
      );

      await Promise.allSettled(
        precacheTargets.map((assetPath) => memeCache.add(assetPath))
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (
            key !== CACHE_NAME &&
            key !== OFFLINE_CACHE_NAME &&
            key !== MEME_CACHE_NAME
          ) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          const basePath = normalizeBasePath(self.location.pathname.replace(/sw\.js$/, ""));
          return caches.match(`${basePath}index.html`);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkRequest = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(OFFLINE_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }

          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkRequest;
    })
  );
});
