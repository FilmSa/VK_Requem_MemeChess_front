const CACHE_NAME = "memechess-shell-v1";
const OFFLINE_CACHE_NAME = "memechess-runtime-v1";

function normalizeBasePath(pathname) {
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalizedPath === "//" ? "/" : normalizedPath;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const basePath = normalizeBasePath(self.location.pathname.replace(/sw\.js$/, ""));
      return cache.addAll([basePath, `${basePath}index.html`]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== OFFLINE_CACHE_NAME) {
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
