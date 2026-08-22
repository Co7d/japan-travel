const CACHE_NAME = "japan-2026-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./places.js",
  "./planning_places.js",
  "./planning_places_more.js",
  "./data.json",
  "./manifest.json",
  "./icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("api.frankfurter.dev")) return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;

  const isDocument = event.request.mode === "navigate" || requestUrl.pathname.endsWith("/index.html") || requestUrl.pathname.endsWith("/data.json");

  event.respondWith(
    isDocument
      ? fetch(event.request).then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
      : caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        }))
  );
});
